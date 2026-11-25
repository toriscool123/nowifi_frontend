import { useState } from 'react';
import { api } from '../api';
import AdminUserHandeling from './AdminUserHandeling';
import AdminGroupHandeling from './AdminGroupHandeling';
import AdminCreateWiki from './AdminCreateWiki';
import AdminWikiHandeling from './AdminWikiHandeling';
import HelpPageAdmin from './HelpPageAdmin';

export default function AdminPage({ me, onBack, onLogout }) {
  const [result, setResult] = useState(null);
  const [currentView, setCurrentView] = useState('main'); // 'main', 'help', 'users', 'groups', 'create-wiki', 'manage-wikis'

  // Modal & loading states
  const [activeModal, setActiveModal] = useState(null); // 'add' | 'login' | null
  const [loading, setLoading] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState(null); // 'login' | 'add' | null

  // Provider Add state
  const [addForm, setAddForm] = useState({ username: '', password: '' });

  // Provider Login / Switch state
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [activeCompanyId, setActiveCompanyId] = useState(null);

  // Skickar x-www-form-urlencoded POST via /api-proxyn med token från localStorage
  async function postProvider(op, params = {}) {
    const token = localStorage.getItem('token') || me?.token || '';

    const response = await fetch(`/api/?o=${op}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: new URLSearchParams(params).toString(),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!response.ok || data?.error || data?.success === false) {
      throw new Error(data?.error || data?.message || `HTTP ${response.status}`);
    }

    return data;
  }

  // Öppna "Provider Login"-modalen och hämta företag via provider_list
  async function handleOpenLoginModal() {
    setActiveModal('login');
    setResult(null);
    setCompanies([]);
    setSelectedCompanyId('');
    setLoading(true);

    try {
      const data = await postProvider('provider_list');

      const rawList = Array.isArray(data?.logins)
        ? data.logins
        : Array.isArray(data)
          ? data
          : data?.providers || data?.companies || data?.data || [];

      const normalized = rawList.map((item, idx) => {
        const id = String(item.id ?? item.company_id ?? idx);
        const name = item.username || item.company_name || item.name || `Företag ${idx + 1}`;
        return { id, name, raw: item };
      });

      setCompanies(normalized);

      const currentActive =
        data?.active_company_id !== undefined && data?.active_company_id !== null
          ? String(data.active_company_id)
          : '';
      setActiveCompanyId(currentActive || null);

      if (currentActive && normalized.some((c) => c.id === currentActive)) {
        setSelectedCompanyId(currentActive);
      } else if (normalized.length > 0) {
        setSelectedCompanyId(normalized[0].id);
      }
    } catch (error) {
      setResult({ error: error.message || 'Kunde inte hämta företagslistan.' });
    } finally {
      setLoading(false);
    }
  }

  // Skapa nytt provider-konto via provider_add
  async function handleProviderAdd(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const data = await postProvider('provider_add', {
        username: addForm.username,
        password: addForm.password,
      });
      setResult(data);
      setAddForm({ username: '', password: '' });
      setActiveModal(null);
    } catch (error) {
      setResult({ error: error.message || 'Kunde inte lägga till provider.' });
    } finally {
      setLoading(false);
    }
  }

  // Byt till valt företag via provider_switch
  async function handleProviderSwitch(e) {
    e.preventDefault();
    if (!selectedCompanyId) return;

    setLoading(true);
    setResult(null);

    try {
      const data = await postProvider('provider_switch', {
        company_id: selectedCompanyId,
      });

      if (data?.token) {
        localStorage.setItem('token', data.token);
      }

      setActiveCompanyId(selectedCompanyId);
      setResult(data);
      setActiveModal(null);
    } catch (error) {
      setResult({ error: error.message || 'Kunde inte byta företag.' });
    } finally {
      setLoading(false);
    }
  }

  if (currentView === 'help') {
    return <HelpPageAdmin me={me} onBack={() => setCurrentView('main')} onLogout={onLogout} />;
  }
  if (currentView === 'users') {
    return <AdminUserHandeling me={me} onBack={() => setCurrentView('main')} onLogout={onLogout} />;
  }
  if (currentView === 'groups') {
    return <AdminGroupHandeling me={me} onBack={() => setCurrentView('main')} onLogout={onLogout} />;
  }
  if (currentView === 'create-wiki') {
    return <AdminCreateWiki me={me} onBack={() => setCurrentView('main')} onLogout={onLogout} />;
  }
  if (currentView === 'manage-wikis') {
    return <AdminWikiHandeling me={me} onBack={() => setCurrentView('main')} onLogout={onLogout} />;
  }

  return (
    <div className="home">
      <header className="home-header">
        <button className="home-brand brand-button" type="button" onClick={onBack} aria-label="Till startsidan">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>NoWifi</span>
        </button>

        <div className="account-area">
          <button className="text-button" type="button" onClick={() => setCurrentView('help')}>
            Hjälp?
          </button>
          <button className="text-button" type="button" onClick={onLogout}>
            Logga ut
          </button>
        </div>
      </header>

      <main className="home-content">
        <section className="wiki-heading">
          <button className="text-button" type="button" onClick={onBack}>
            Tillbaka till startsidan
          </button>
          <div aria-hidden="true" style={{ height: '1rem' }} />
          <p className="eyebrow">SuperAdministration</p>
          <h1>SuperAdminpanel</h1>
          <p>
            Inloggad som {me.username} – tjänster: {me.services?.join(', ') || 'inga'}
          </p>

          <div style={buttonGroupStyle}>
            <button
              type="button"
              style={{
                ...loginBtnStyle,
                ...(hoveredBtn === 'login' ? loginBtnHoverStyle : {}),
              }}
              onMouseEnter={() => setHoveredBtn('login')}
              onMouseLeave={() => setHoveredBtn(null)}
              onClick={handleOpenLoginModal}
            >
              <span>Provider Login</span>
            </button>

            <button
              type="button"
              style={{
                ...addBtnStyle,
                ...(hoveredBtn === 'add' ? addBtnHoverStyle : {}),
              }}
              onMouseEnter={() => setHoveredBtn('add')}
              onMouseLeave={() => setHoveredBtn(null)}
              onClick={() => {
                setResult(null);
                setActiveModal('add');
              }}
            >
              <span>+ Provider Add</span>
            </button>
          </div>
        </section>

        {result && (
          <pre
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: result.error ? '#fee2e2' : '#f3f4f6',
              color: result.error ? '#991b1b' : '#111827',
              borderRadius: '8px',
              overflowX: 'auto',
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </main>

      {/* POPUP MODAL: PROVIDER ADD */}
      {activeModal === 'add' && (
        <div style={overlayStyle} onClick={() => setActiveModal(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Provider Add</h2>
            <form onSubmit={handleProviderAdd} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <label style={labelStyle}>
                Användarnamn
                <input
                  type="text"
                  required
                  value={addForm.username}
                  onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                  placeholder="t.ex. nowifi"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Lösenord
                <input
                  type="password"
                  required
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="••••••••"
                  style={inputStyle}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button type="button" style={cancelBtnStyle} onClick={() => setActiveModal(null)}>
                  Avbryt
                </button>
                <button type="submit" style={loginBtnStyle} disabled={loading}>
                  {loading ? 'Skapar...' : 'Skapa provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: PROVIDER LOGIN (LISTA + SWITCH) */}
      {activeModal === 'login' && (
        <div style={overlayStyle} onClick={() => setActiveModal(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Provider Login</h2>

            {loading && companies.length === 0 ? (
              <p>Hämtar företag...</p>
            ) : (
              <form onSubmit={handleProviderSwitch} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <label style={labelStyle}>
                  Välj företag
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    disabled={companies.length === 0}
                    style={inputStyle}
                  >
                    {companies.length === 0 ? (
                      <option value="">Inga företag hittades</option>
                    ) : (
                      companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                          {activeCompanyId === company.id ? ' (Aktiv)' : ''}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
                  <button type="button" style={cancelBtnStyle} onClick={() => setActiveModal(null)}>
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    style={{
                      ...loginBtnStyle,
                      opacity: loading || !selectedCompanyId ? 0.55 : 1,
                      cursor: loading || !selectedCompanyId ? 'not-allowed' : 'pointer',
                    }}
                    disabled={loading || !selectedCompanyId}
                  >
                    {loading ? 'Byter...' : 'Byt företag'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const buttonGroupStyle = {
  display: 'flex',
  gap: '0.85rem',
  marginTop: '1.35rem',
  flexWrap: 'wrap',
  alignItems: 'center',
};

const baseBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.45rem',
  padding: '0.65rem 1.15rem',
  borderRadius: '10px',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'transform 0.14s ease, box-shadow 0.14s ease, background-color 0.14s ease, border-color 0.14s ease',
  outline: 'none',
};

const loginBtnStyle = {
  ...baseBtnStyle,
  backgroundColor: '#111827',
  color: '#ffffff',
  border: '1px solid #111827',
  boxShadow: '0 2px 6px rgba(17, 24, 39, 0.18)',
};

const loginBtnHoverStyle = {
  backgroundColor: '#1f2937',
  transform: 'translateY(-1px)',
  boxShadow: '0 6px 14px rgba(17, 24, 39, 0.24)',
};

const addBtnStyle = {
  ...baseBtnStyle,
  backgroundColor: '#ffffff',
  color: '#111827',
  border: '1px solid #d1d5db',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
};

const addBtnHoverStyle = {
  backgroundColor: '#f9fafb',
  borderColor: '#9ca3af',
  transform: 'translateY(-1px)',
  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
};

const cancelBtnStyle = {
  ...baseBtnStyle,
  padding: '0.55rem 0.95rem',
  backgroundColor: 'transparent',
  color: '#374151',
  border: '1px solid transparent',
  boxShadow: 'none',
};

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle = {
  backgroundColor: '#fff',
  color: '#111',
  padding: '1.5rem',
  borderRadius: '12px',
  width: '100%',
  maxWidth: '420px',
  boxShadow: '0 12px 28px rgba(0, 0, 0, 0.25)',
};

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
  fontSize: '0.9rem',
  fontWeight: 500,
};

const inputStyle = {
  padding: '0.6rem 0.75rem',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '1rem',
  backgroundColor: '#fff',
  color: '#111827',
};
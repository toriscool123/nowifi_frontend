import { useState } from 'react';
import { api } from '../api';
import AdminUserHandeling from './AdminUserHandeling';
import AdminGroupHandeling from './AdminGroupHandeling';
import AdminCreateWiki from './AdminCreateWiki';
import AdminWikiHandeling from './AdminWikiHandeling';
import HelpPageAdmin from './HelpPageAdmin';
import Footer from '../components/Footer';
import '../index.css';

export default function AdminPage({ me, onBack, onLogout }) {
  const [result, setResult] = useState(null);
  const [currentView, setCurrentView] = useState('main'); // 'main', 'help', 'users', 'groups', 'create-wiki', 'manage-wikis'

  // Modal & loading states
  const [activeModal, setActiveModal] = useState(null); // 'add' | 'login' | null
  const [loading, setLoading] = useState(false);

  // Provider Add state
  const [addForm, setAddForm] = useState({ username: '', password: '' });

  // Provider Login / Switch state
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [activeCompanyId, setActiveCompanyId] = useState(null);

  // Hjälpfunktion för att kontrollera om felet beror på ogiltig/utgått token
  function handleApiError(error) {
    const msg = error.message || '';
    if (msg.toLowerCase().includes('ogiltig token') || msg.toLowerCase().includes('token')) {
      return 'Din token har gått ut eller är ogiltig, vänligen logga in igen.';
    }
    return msg || 'Ett oväntat fel uppstod.';
  }

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
      const friendlyMessage = handleApiError(error);
      setResult({ error: friendlyMessage });
      if (friendlyMessage.includes('logga in igen') && onLogout) {
        setTimeout(() => onLogout(), 3000);
      }
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
      const friendlyMessage = handleApiError(error);
      setResult({ error: friendlyMessage });
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
      const friendlyMessage = handleApiError(error);
      setResult({ error: friendlyMessage });
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

          <div className="action-buttons">
            <button className="btn btn-primary" type="button" onClick={handleOpenLoginModal}>
              <span>Provider Login</span>
            </button>

            <button
              className="btn btn-secondary"
              type="button"
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
          <div className={result.error ? 'admin-result alert alert-error' : 'admin-result'} role={result.error ? 'alert' : undefined} style={{ padding: '1rem', borderRadius: '8px', background: result.error ? '#f8d7da' : '#d4edda', color: result.error ? '#721c24' : '#155724', marginTop: '1rem' }}>
            {result.error ? <p><strong>Fel:</strong> {result.error}</p> : <pre>{JSON.stringify(result, null, 2)}</pre>}
          </div>
        )}
      </main>

      {/* POPUP MODAL: PROVIDER ADD */}
      {activeModal === 'add' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Provider Add</h3>
            <form className="modal-form" onSubmit={handleProviderAdd}>
              <label className="form-label">
                Användarnamn
                <input
                  className="form-input"
                  type="text"
                  required
                  value={addForm.username}
                  onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                  placeholder="t.ex. nowifi"
                />
              </label>

              <label className="form-label">
                Lösenord
                <input
                  className="form-input"
                  type="password"
                  required
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="••••••••"
                />
              </label>

              <div className="modal-actions">
                <button className="btn btn-secondary" type="button" onClick={() => setActiveModal(null)}>
                  Avbryt
                </button>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Skapar...' : 'Skapa provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: PROVIDER LOGIN (LISTA + SWITCH) */}
      {activeModal === 'login' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Provider Login</h3>

            {loading && companies.length === 0 ? (
              <p>Hämtar företag...</p>
            ) : (
              <form className="modal-form" onSubmit={handleProviderSwitch}>
                <label className="form-label">
                  Välj företag
                  <select
                    className="form-input"
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    disabled={companies.length === 0}
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

                <div className="modal-actions">
                  <button className="btn btn-secondary" type="button" onClick={() => setActiveModal(null)}>
                    Avbryt
                  </button>
                  <button
                    className="btn btn-primary"
                    type="submit"
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

      <Footer />
    </div>
  );
}
import { useEffect, useState } from 'react';
import AdminUserHandeling from './AdminUserHandeling';
import AdminGroupHandeling from './AdminGroupHandeling';
import AdminCreateWiki from './AdminCreateWiki';
import AdminWikiHandeling from './AdminWikiHandeling';
import HelpPageAdmin from './HelpPageAdmin';
import Footer from '../components/Footer';
import '../index.css';

function normalizeProviders(data) {
  const rawList = Array.isArray(data?.logins)
    ? data.logins
    : Array.isArray(data)
      ? data
      : data?.providers || data?.companies || data?.data || [];

  return rawList.map((item, idx) => {
    const id = String(item.id ?? item.company_id ?? idx);
    const name = item.username || item.company_name || item.name || `Företag ${idx + 1}`;
    return { id, name, raw: item };
  });
}

export default function AdminPage({ me, onBack, onLogout }) {
  // { type: 'success' | 'error', text: string } | null
  const [feedback, setFeedback] = useState(null);
  const [currentView, setCurrentView] = useState('main'); // 'main', 'help', 'users', 'groups', 'create-wiki', 'manage-wikis'

  // Modal & loading states
  const [activeModal, setActiveModal] = useState(null); // 'add' | 'edit' | 'delete' | null
  const [loading, setLoading] = useState(false);

  // Provider Add state
  const [addForm, setAddForm] = useState({ username: '', password: '' });

  // Provider List / Switch / Edit / Delete state
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [activeCompanyId, setActiveCompanyId] = useState(null);
  const [editForm, setEditForm] = useState({ username: '', password: '' });

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

  // Hämtar företagslistan via provider_list
  async function fetchProviders(preferredId = null) {
    setLoading(true);
    try {
      const data = await postProvider('provider_list');
      const normalized = normalizeProviders(data);
      setCompanies(normalized);

      const currentActive =
        data?.active_company_id !== undefined && data?.active_company_id !== null
          ? String(data.active_company_id)
          : '';
      setActiveCompanyId(currentActive || null);

      const targetId = preferredId ? String(preferredId) : currentActive;
      if (targetId && normalized.some((c) => c.id === targetId)) {
        setSelectedCompanyId(targetId);
      } else if (normalized.length > 0) {
        setSelectedCompanyId(normalized[0].id);
      } else {
        setSelectedCompanyId('');
      }

      return normalized;
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error.message || 'Kunde inte hämta företagslistan.',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getIdPayload(company) {
    const rawId = company?.raw?.id ?? company?.id ?? selectedCompanyId;
    const rawCompanyId = company?.raw?.company_id ?? rawId;
    return {
      id: String(rawId),
      company_id: String(rawCompanyId),
    };
  }

  // Öppna "Redigera Provider"-modalen och hämta detaljer via provider_get
  async function handleOpenEditModal(companyToEdit) {
    if (!companyToEdit) return;
    setFeedback(null);
    setSelectedCompanyId(companyToEdit.id);
    setEditForm({
      username: companyToEdit.raw?.username || companyToEdit.name || '',
      password: '',
    });
    setActiveModal('edit');

    try {
      setLoading(true);
      const data = await postProvider('provider_get', getIdPayload(companyToEdit));
      const item = data?.login || data?.provider || data?.company || data?.data || data;
      if (item && typeof item === 'object') {
        setEditForm({
          username: item.username || item.company_name || item.name || companyToEdit.name || '',
          password: '',
        });
      }
    } catch {
      // Behåll förifyllda värden från listan om provider_get inte returnerar extra fält
    } finally {
      setLoading(false);
    }
  }

  // Öppna "Ta bort Provider"-modalen
  function handleOpenDeleteModal(companyToDelete) {
    if (!companyToDelete) return;
    setFeedback(null);
    setSelectedCompanyId(companyToDelete.id);
    setActiveModal('delete');
  }

  // Skapa nytt provider-konto via provider_add
  async function handleProviderAdd(e) {
    e.preventDefault();
    const cleanUsername = addForm.username.trim();
    setLoading(true);
    setFeedback(null);

    try {
      await postProvider('provider_add', {
        username: cleanUsername,
        password: addForm.password,
      });
      setFeedback({
        type: 'success',
        text: `Providern "${cleanUsername}" har skapats.`,
      });
      setAddForm({ username: '', password: '' });
      setActiveModal(null);
      await fetchProviders();
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error.message || 'Kunde inte lägga till provider.',
      });
    } finally {
      setLoading(false);
    }
  }

  // Uppdatera provider via provider_update
  async function handleProviderUpdate(e) {
    e.preventDefault();
    const target = companies.find((c) => c.id === selectedCompanyId);
    if (!target) return;

    const cleanUsername = editForm.username.trim();
    setLoading(true);
    setFeedback(null);

    try {
      const payload = {
        ...getIdPayload(target),
        username: cleanUsername,
      };
      if (editForm.password.trim()) {
        payload.password = editForm.password;
      }

      await postProvider('provider_update', payload);
      setFeedback({
        type: 'success',
        text: `Providern "${cleanUsername}" har uppdaterats.`,
      });
      setEditForm({ username: '', password: '' });
      setActiveModal(null);
      await fetchProviders(target.id);
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error.message || 'Kunde inte uppdatera provider.',
      });
    } finally {
      setLoading(false);
    }
  }

  // Ta bort provider via provider_delete
  async function handleProviderDelete(e) {
    e.preventDefault();
    const target = companies.find((c) => c.id === selectedCompanyId);
    if (!target) return;

    setLoading(true);
    setFeedback(null);

    try {
      await postProvider('provider_delete', getIdPayload(target));
      setFeedback({
        type: 'success',
        text: `Providern "${target.name}" har tagits bort.`,
      });
      setActiveModal(null);
      await fetchProviders();
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error.message || 'Kunde inte ta bort provider.',
      });
    } finally {
      setLoading(false);
    }
  }

  // Byt till valt företag via provider_switch
  async function handleProviderSwitch(targetId) {
    if (!targetId) return;

    const targetCompany = companies.find((c) => c.id === String(targetId));
    setLoading(true);
    setFeedback(null);

    try {
      const data = await postProvider('provider_switch', {
        company_id: targetId,
      });

      if (data?.token) {
        localStorage.setItem('token', data.token);
      }

      setActiveCompanyId(String(targetId));
      setSelectedCompanyId(String(targetId));

      const servicesText =
        Array.isArray(data?.services) && data.services.length > 0
          ? ` (tjänster: ${data.services.join(', ')})`
          : '';
      const companyLabel = targetCompany?.name || `företag #${targetId}`;

      setFeedback({
        type: 'success',
        text: `Bytte till ${companyLabel}${servicesText}.`,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error.message || 'Kunde inte byta företag.',
      });
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

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) || null;

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

          <div className="action-buttons" style={{ marginTop: '1.5rem' }}>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                setFeedback(null);
                setActiveModal('add');
              }}
            >
              <span>+ Add company</span>
            </button>
          </div>
        </section>

        {feedback && (
          <div
            className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}
            role={feedback.type === 'error' ? 'alert' : 'status'}
            style={{ marginTop: '24px', justifyContent: 'space-between' }}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              className="remove-badge-btn"
              onClick={() => setFeedback(null)}
              aria-label="Stäng meddelande"
              style={{ color: 'inherit' }}
            >
              ×
            </button>
          </div>
        )}

        {/* ÖVERSIKT ÖVER FÖRETAG / PROVIDERS */}
        <section className="admin-section" aria-label="Registrerade providers">
          <div className="panel-header">
            <h2>Företag / Providers ({companies.length})</h2>
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              onClick={() => fetchProviders()}
              disabled={loading}
            >
              {loading ? 'Uppdaterar...' : 'Uppdatera lista'}
            </button>
          </div>

          {companies.length === 0 ? (
            <p className="text-muted" style={{ marginTop: '12px' }}>
              {loading ? 'Hämtar företag...' : 'Inga företag hittades.'}
            </p>
          ) : (
            <div className="list-grid" style={{ marginTop: '16px' }}>
              {companies.map((company) => {
                const isActive = activeCompanyId === company.id;
                return (
                  <div
                    key={company.id}
                    className={`list-item ${isActive ? 'selected' : ''}`}
                    style={{ cursor: 'default' }}
                  >
                    <div>
                      <strong>{company.name}</strong>
                      <span className="text-muted" style={{ marginLeft: '8px' }}>
                        (ID: {company.id})
                      </span>
                      {isActive && (
                        <span className="selected-indicator" style={{ marginLeft: '10px' }}>
                          Aktiv
                        </span>
                      )}
                    </div>

                    <div className="action-buttons">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleProviderSwitch(company.id)}
                        disabled={loading || isActive}
                      >
                        {isActive ? 'Inloggad' : 'Byt till'}
                      </button>

                      <button
                        type="button"
                        className="btn btn-warning btn-sm"
                        onClick={() => handleOpenEditModal(company)}
                        disabled={loading}
                      >
                        Redigera
                      </button>

                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleOpenDeleteModal(company)}
                        disabled={loading}
                      >
                        Ta bort
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
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

      {/* POPUP MODAL: PROVIDER EDIT (GET + UPDATE) */}
      {activeModal === 'edit' && selectedCompany && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Redigera {selectedCompany.name}</h3>
            <form className="modal-form" onSubmit={handleProviderUpdate}>
              <label className="form-label">
                Användarnamn
                <input
                  className="form-input"
                  type="text"
                  required
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  placeholder="Nytt användarnamn"
                />
              </label>

              <label className="form-label">
                Nytt lösenord (valfritt)
                <input
                  className="form-input"
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Lämna tomt för att behålla nuvarande"
                />
              </label>

              <div className="modal-actions">
                <button className="btn btn-secondary" type="button" onClick={() => setActiveModal(null)}>
                  Avbryt
                </button>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Sparar...' : 'Spara ändringar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: PROVIDER DELETE */}
      {activeModal === 'delete' && selectedCompany && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Ta bort Provider</h3>
            <form className="modal-form" onSubmit={handleProviderDelete}>
              <p className="modal-text">
                Är du säker på att du vill ta bort <strong>{selectedCompany.name}</strong>? Detta går inte att ångra.
              </p>

              <div className="modal-actions">
                <button className="btn btn-secondary" type="button" onClick={() => setActiveModal(null)}>
                  Avbryt
                </button>
                <button
                  className="btn btn-danger"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Tar bort...' : 'Ta bort permanently'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
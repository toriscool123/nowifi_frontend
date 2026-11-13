import { useState, useEffect } from 'react';
import { api } from '../api';
import { addWikiCollaborator, addWikiGroupCollaborator, removeWikiCollaborator } from '../Helpers/wikiHelpers';
import SelectionModal from '../Helpers/SelectionModal';

export default function AdminWikiHandeling({ me, onBack, onLogout }) {
  const [wikis, setWikis] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedWiki, setSelectedWiki] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // Modal-state ('edit' | 'adduser' | 'addgroup' | 'removecollab' | null)
  const [activeModal, setActiveModal] = useState(null);

  // Data för valbara användare, grupper och borttagning
  const [allUsers, setAllUsers] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [selectedUsernames, setSelectedUsernames] = useState([]);
  const [selectedGroupNames, setSelectedGroupNames] = useState([]);
  const [selectedCollabsToRemove, setSelectedCollabsToRemove] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Form-state för redigering av wiki
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState('public');
  const [editTags, setEditTags] = useState('');

  async function fetchWikis() {
    try {
      setLoading(true);
      setError(null);
      const data = await api('w_wiki_list', 'GET', {
        limit: 50,
        offset: 0,
        mine: onlyMine ? 1 : 0
      });

      if (data.success || Array.isArray(data.wikis) || Array.isArray(data.list) || Array.isArray(data)) {
        const wikiList = data.wikis || data.list || (Array.isArray(data) ? data : []);
        setWikis(wikiList);
        
        // Om en wiki är vald sedan tidigare, uppdatera dess referens i listan så collaborators hänger med
        if (selectedWiki) {
          const currentId = selectedWiki.id || selectedWiki.wiki_id;
          const updated = wikiList.find(w => (w.id || w.wiki_id) === currentId);
          if (updated) setSelectedWiki(updated);
        }
      } else {
        setError('Kunde inte hämta wikis.');
      }
    } catch (err) {
      setError(err.message || 'Ett fel uppstod vid hämtning av wikis.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllUsersAndGroups() {
    try {
      setLoadingUsers(true);
      setLoadingGroups(true);
      const usersRes = await api('listusers', 'GET');
      if (usersRes.success) setAllUsers(usersRes.users || []);

      const groupsRes = await api('g_list', 'GET');
      if (groupsRes.success) setAllGroups(groupsRes.groups || groupsRes.list || []);
    } catch (err) {
      console.error('Kunde inte hämta metadata:', err);
    } finally {
      setLoadingUsers(false);
      setLoadingGroups(false);
    }
  }

  useEffect(() => {
    fetchWikis();
    fetchAllUsersAndGroups();
  }, [onlyMine]);

  // När selectedWiki ändras, uppdatera redigeringsfälten
  useEffect(() => {
    if (selectedWiki) {
      setEditTitle(selectedWiki.title || selectedWiki.name || '');
      setEditStatus(selectedWiki.status || 'public');
      setEditTags(selectedWiki.tags || '');
    }
  }, [selectedWiki]);

  function showTemporarySuccess(msg) {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  }

  function closeModal() {
    setActiveModal(null);
    setActionMessage(null);
    setSelectedUsernames([]);
    setSelectedGroupNames([]);
    setSelectedCollabsToRemove([]);
  }

  // Hantera redigering av wiki (w_wiki_update)
  async function handleUpdateWiki(e) {
    e.preventDefault();
    const wikiId = selectedWiki.id || selectedWiki.wiki_id;
    try {
      const res = await api('w_wiki_update', 'POST', {
        wiki_id: wikiId,
        title: editTitle,
        status: editStatus,
        tags: editTags
      });

      if (res.success || res.message) {
        closeModal();
        fetchWikis();
        showTemporarySuccess(`Wikisidan "${editTitle}" har uppdaterats!`);
        setSelectedWiki({ ...selectedWiki, title: editTitle, status: editStatus, tags: editTags });
      } else {
        setActionMessage(res.error || 'Kunde inte uppdatera wikisidan.');
      }
    } catch (err) {
      setActionMessage(err.message || 'Ett fel uppstod.');
    }
  }

  // Lägg till valda användare som collaborators
  async function handleAddCollaborators() {
    if (selectedUsernames.length === 0) return;
    const wikiId = selectedWiki.id || selectedWiki.wiki_id;

    try {
      let count = 0;
      for (const username of selectedUsernames) {
        const res = await addWikiCollaborator(wikiId, username);
        if (res.success || res.message) count++;
      }
      closeModal();
      fetchWikis();
      showTemporarySuccess(`Lade till ${count} användare som collaborators!`);
    } catch (err) {
      setActionMessage(err.message || 'Ett fel uppstod.');
    }
  }

  // Lägg till valda grupper som collaborators
  async function handleAddGroupCollaborators() {
    if (selectedGroupNames.length === 0) return;
    const wikiId = selectedWiki.id || selectedWiki.wiki_id;

    try {
      let count = 0;
      for (const group of selectedGroupNames) {
        const res = await addWikiGroupCollaborator(wikiId, group);
        if (res.success || res.message) count++;
      }
      closeModal();
      fetchWikis();
      showTemporarySuccess(`Lade till ${count} grupper som collaborators!`);
    } catch (err) {
      setActionMessage(err.message || 'Ett fel uppstod.');
    }
  }

  const filteredWikis = wikis.filter((w) => {
    const title = w.title || w.name || '';
    return title.toLowerCase().includes(searchQuery.trim().toLowerCase());
  });

  const selectedWikiTitle = selectedWiki ? (selectedWiki.title || selectedWiki.name) : '';
  const selectedWikiId = selectedWiki ? (selectedWiki.id || selectedWiki.wiki_id) : null;

  return (
    <div className="home">
      <header className="home-header">
        <button className="home-brand brand-button" type="button" onClick={onBack} aria-label="Tillbaka">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>NoWifi</span>
        </button>

        <div className="account-area">
          <button className="text-button" type="button" onClick={onBack}>
            ← Tillbaka till Admin
          </button>
          <button className="text-button" type="button" onClick={onLogout}>
            Logga ut
          </button>
        </div>
      </header>

      <main className="home-content">
        <section className="wiki-heading" style={{ marginBottom: '20px' }}>
          <p className="eyebrow">ADMINISTRATION</p>
          <h1>Hantera wiki</h1>
          <p style={{ margin: 0 }}>Välj en wiki nedan för att hantera dess inställningar och behörigheter.</p>
        </section>

        {successMessage && (
          <div style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#065f46', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: 600 }}>
            ✅ {successMessage}
          </div>
        )}

        {/* Sökfält och Checkbox för Mina wikis */}
        <section className="wiki-tools" style={{ marginBottom: '20px', display: 'grid', gap: '12px' }}>
          <label className="search-field" style={{ width: '100%' }}>
            <span className="visually-hidden">Sök wiki</span>
            <input
              type="search"
              placeholder="Sök wiki-titel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', color: '#17243b' }}>
            <input
              type="checkbox"
              checked={onlyMine}
              onChange={(e) => setOnlyMine(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            Visa endast mina skapade wikis
          </label>
        </section>

        {/* Vald wiki panel med knappar */}
        <section 
          className="admin-section" 
          style={{ 
            marginBottom: '20px', 
            background: selectedWiki ? '#f8fafc' : '#f1f5f9',
            border: selectedWiki ? '1px solid #cbd5e1' : '1px dashed #cbd5e1'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: selectedWiki ? '16px' : 0 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#17243b' }}>
                {selectedWiki ? `Vald wiki: ${selectedWikiTitle} (ID: ${selectedWikiId})` : 'Ingen wiki vald'}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                {selectedWiki ? 'Använd knapparna för att redigera eller hantera behörigheter.' : 'Klicka på en wiki i listan nedan för att välja.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={!selectedWiki}
                onClick={() => { setActiveModal('edit'); setActionMessage(null); }}
                style={{ ...actionBtnStyle, background: selectedWiki ? '#2563eb' : '#cbd5e1', cursor: selectedWiki ? 'pointer' : 'not-allowed' }}
              >
                Edit wiki
              </button>
              <button
                type="button"
                disabled={!selectedWiki}
                onClick={() => { setSelectedUsernames([]); setActiveModal('adduser'); }}
                style={{ ...actionBtnStyle, background: selectedWiki ? '#0ea5e9' : '#cbd5e1', cursor: selectedWiki ? 'pointer' : 'not-allowed' }}
              >
                Add collaborator
              </button>
              <button
                type="button"
                disabled={!selectedWiki}
                onClick={() => { setSelectedGroupNames([]); setActiveModal('addgroup'); }}
                style={{ ...actionBtnStyle, background: selectedWiki ? '#10b981' : '#cbd5e1', cursor: selectedWiki ? 'pointer' : 'not-allowed' }}
              >
                Add collaborator group
              </button>
              <button
                type="button"
                disabled={!selectedWiki}
                onClick={() => { setSelectedCollabsToRemove([]); setActiveModal('removecollab'); }}
                style={{ ...actionBtnStyle, background: selectedWiki ? '#b42318' : '#cbd5e1', cursor: selectedWiki ? 'pointer' : 'not-allowed' }}
              >
                Remove collaborator
              </button>
            </div>
          </div>
        </section>

        {/* Wikilista */}
        <section className="admin-section">
          <h2>Wikilista ({filteredWikis.length})</h2>

          {loading && <p>Laddar wikis...</p>}
          {error && <p style={{ color: '#b42318' }}>{error}</p>}

          {!loading && !error && (
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '16px', display: 'grid', gap: '10px' }}>
              {filteredWikis.length > 0 ? (
                filteredWikis.map((w, index) => {
                  const title = w.title || w.name || 'Okänd wiki';
                  const isSelected = selectedWikiId === (w.id || w.wiki_id);
                  const owner = w.owner_username || 'Okänd';

                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedWiki(w)}
                      style={{
                        padding: '14px 16px',
                        background: isSelected ? '#eff6ff' : '#fff',
                        border: isSelected ? '2px solid #2563eb' : '1px solid #d5deeb',
                        borderRadius: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '1.05rem', color: '#17243b' }}>{title}</strong>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                          Ägare: {owner} | Taggar: {w.tags || 'inga'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>
                        Status: {w.status || 'public'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: '#6b7890' }}>Inga wikis matchade din sökning.</p>
              )}
            </div>
          )}
        </section>
      </main>

      {/* MODAL: EDIT WIKI */}
      {activeModal === 'edit' && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3>Redigera wiki</h3>
            {actionMessage && <p style={{ color: '#b42318', fontSize: '0.9rem', marginTop: '8px' }}>{actionMessage}</p>}
            
            <form onSubmit={handleUpdateWiki} style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
              <label style={{ display: 'grid', gap: '4px', fontSize: '0.9rem', fontWeight: 600 }}>
                Titel:
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  style={inputStyle}
                />
              </label>

              <label style={{ display: 'grid', gap: '4px', fontSize: '0.9rem', fontWeight: 600 }}>
                Status:
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={inputStyle}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </label>

              <label style={{ display: 'grid', gap: '4px', fontSize: '0.9rem', fontWeight: 600 }}>
                Taggar:
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  style={inputStyle}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={closeModal} style={cancelButtonStyle}>Avbryt</button>
                <button type="submit" style={submitButtonStyle}>Spara ändringar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD COLLABORATOR (Användare) */}
      {activeModal === 'adduser' && (
        <SelectionModal
          title={`Lägg till användare på ${selectedWikiTitle}`}
          items={allUsers.filter(u => !u.banned_at)}
          selectedItems={selectedUsernames}
          onToggleItem={(username) => {
            setSelectedUsernames(prev => 
              prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]
            );
          }}
          onConfirm={handleAddCollaborators}
          onClose={closeModal}
          loading={loadingUsers}
          confirmButtonText="Lägg till valda"
        />
      )}

      {/* MODAL: ADD COLLABORATOR GROUP (Grupper) */}
      {activeModal === 'addgroup' && (
        <SelectionModal
          title={`Lägg till grupp på ${selectedWikiTitle}`}
          items={allGroups}
          selectedItems={selectedGroupNames}
          onToggleItem={(groupName) => {
            const name = typeof groupName === 'string' ? groupName : (groupName.name || groupName.group || '');
            setSelectedGroupNames(prev => 
              prev.includes(name) ? prev.filter(g => g !== name) : [...prev, name]
            );
          }}
          onConfirm={handleAddGroupCollaborators}
          onClose={closeModal}
          loading={loadingGroups}
          confirmButtonText="Lägg till valda grupper"
        />
      )}


      {/* MODAL: REMOVE COLLABORATOR */}
      {/* MODAL: REMOVE COLLABORATOR */}
      {activeModal === 'removecollab' && (
        <SelectionModal
          title={`Ta bort collaborator från ${selectedWikiTitle}`}
          items={selectedWiki?.contributors || []}
          selectedItems={selectedCollabsToRemove}
          onToggleItem={(username) => {
            setSelectedCollabsToRemove(prev => 
              prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]
            );
          }}
          onConfirm={async () => {
            if (selectedCollabsToRemove.length === 0) return;
            const wikiId = selectedWiki.wiki_id || selectedWiki.id;
            try {
              let count = 0;
              for (const username of selectedCollabsToRemove) {
                const res = await api('w_remove_contributor', 'POST', {
                  wiki_id: wikiId,
                  username: username
                });
                if (res && (res.success || res.message)) {
                  count++;
                }
              }
              closeModal();
              fetchWikis();
              showTemporarySuccess(`Tog bort ${count} collaborators från wikin.`);
            } catch (err) {
              setActionMessage(err.message || 'Ett fel uppstod vid borttagning.');
            }
          }}
          onClose={closeModal}
          confirmButtonText="Ta bort valda"
          confirmButtonStyle={{ background: '#b42318' }}
        />
      )}

    </div>
  );
}

// Stilar
const actionBtnStyle = {
  padding: '8px 16px',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontWeight: 600,
  fontSize: '0.9rem'
};

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  zIndex: 1000
};

const modalContentStyle = {
  background: '#fff', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '420px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
};

const inputStyle = {
  padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', width: '100%', background: '#fff'
};

const cancelButtonStyle = {
  padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px',
  cursor: 'pointer', fontWeight: 600, color: '#475569'
};

const submitButtonStyle = {
  padding: '8px 16px', background: '#17243b', color: '#fff', border: 'none', borderRadius: '6px',
  cursor: 'pointer', fontWeight: 600
};
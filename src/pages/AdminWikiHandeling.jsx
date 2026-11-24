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
        const res = await api('w_add_contributor', 'POST', {
          wiki_id: wikiId,
          username: username
        });
        if (res && (res.success || res.message)) count++;
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
        const res = await api('w_add_contributor', 'POST', {
          wiki_id: wikiId,
          group: group
        });
        if (res && (res.success || res.message)) count++;
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
          <button className="text-button" type="button" onClick={onLogout}>
            Logga ut
          </button>
        </div>
      </header>

      <main className="home-content">
        <div className="admin-header-actions">
          <section className="wiki-heading">
            <button className="text-button" type="button" onClick={onBack}>
              ← Tillbaka till Admin
            </button>
            <div aria-hidden="true" style={{ height: '1rem' }} />
            <p className="eyebrow">ADMINISTRATION</p>
            <h1>Hantera wiki</h1>
            <p>Välj en wiki nedan för att hantera dess inställningar och behörigheter.</p>
          </section>
        </div>

        {successMessage && (
          <div className="success-banner">
            ✅ {successMessage}
          </div>
        )}

        {/* Sökfält och Checkbox för Mina wikis */}
        <section className="wiki-tools">
          <label className="search-field">
            <span className="visually-hidden">Sök wiki</span>
            <input
              type="search"
              placeholder="Sök wiki-titel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
            />
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={onlyMine}
              onChange={(e) => setOnlyMine(e.target.checked)}
            />
            Visa endast mina skapade wikis
          </label>
        </section>

        {/* Vald wiki panel med knappar */}
        <section className={`admin-section ${selectedWiki ? 'active-panel' : 'inactive-panel'}`}>
          <div className="panel-header">
            <div>
              <h3>
                {selectedWiki ? `Vald wiki: ${selectedWikiTitle} (ID: ${selectedWikiId})` : 'Ingen wiki vald'}
              </h3>
              <p className="subtext">
                {selectedWiki ? 'Använd knapparna för att redigera eller hantera behörigheter.' : 'Klicka på en wiki i listan nedan för att välja.'}
              </p>
            </div>

            <div className="action-buttons">
              <button
                type="button"
                disabled={!selectedWiki}
                onClick={() => { setActiveModal('edit'); setActionMessage(null); }}
                className="btn btn-primary"
              >
                Edit wiki
              </button>
              <button
                type="button"
                disabled={!selectedWiki}
                onClick={() => { setSelectedUsernames([]); setActiveModal('adduser'); }}
                className="btn btn-info"
              >
                Add collaborator
              </button>
              <button
                type="button"
                disabled={!selectedWiki}
                onClick={() => { setSelectedGroupNames([]); setActiveModal('addgroup'); }}
                className="btn btn-success"
              >
                Add collaborator group
              </button>
              <button
                type="button"
                disabled={!selectedWiki}
                onClick={() => { setSelectedCollabsToRemove([]); setActiveModal('removecollab'); }}
                className="btn btn-danger"
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
          {error && <p className="error-text">{error}</p>}

          {!loading && !error && (
            <div className="scrollable-list">
              <div className="list-grid">
                {filteredWikis.length > 0 ? (
                  filteredWikis.map((w, index) => {
                    const title = w.title || w.name || 'Okänd wiki';
                    const isSelected = selectedWikiId === (w.id || w.wiki_id);
                    const owner = w.owner_username || 'Okänd';

                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedWiki(w)}
                        className={`list-item ${isSelected ? 'selected' : ''}`}
                      >
                        <div>
                          <strong>{title}</strong>
                          <span className="subtext" style={{ display: 'block', marginTop: '2px' }}>
                            Ägare: {owner} | Taggar: {w.tags || 'inga'}
                          </span>
                        </div>
                        <span className="badge">
                          Status: {w.status || 'public'}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="subtext">Inga wikis matchade din sökning.</p>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* MODAL: EDIT WIKI */}
      {activeModal === 'edit' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Redigera wiki</h3>
            {actionMessage && <p className="error-text">{actionMessage}</p>}
            
            <form onSubmit={handleUpdateWiki} className="modal-form">
              <label className="form-label">
                Titel:
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="form-input"
                />
              </label>

              <label className="form-label">
                Status:
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="form-input">
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </label>

              <label className="form-label">
                Taggar:
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="form-input"
                />
              </label>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn btn-secondary">Avbryt</button>
                <button type="submit" className="btn btn-primary">Spara ändringar</button>
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
          confirmButtonStyle={{ background: '#b42318' }} // Om SelectionModal accepterar style props, låt denna vara
        />
      )}
    </div>
  );
}
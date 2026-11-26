import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';
import SelectionModal from '../Helpers/SelectionModal';

const WIKIS_LIMIT = 10;
const USERS_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 300;
const SCROLL_THRESHOLD_PX = 80;

function getWikiId(wiki) {
  return wiki?.id ?? wiki?.wiki_id;
}

function mergeUniqueWikis(existing, incoming) {
  const map = new Map();

  for (const w of existing) {
    const key = getWikiId(w) ?? w.title ?? w.name;
    map.set(String(key), w);
  }

  for (const w of incoming) {
    const key = getWikiId(w) ?? w.title ?? w.name;
    map.set(String(key), w);
  }

  return Array.from(map.values());
}

export default function AdminWikiHandeling({ me, onBack, onLogout }) {
  const [wikis, setWikis] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const isFetchingRef = useRef(false);
  const listContainerRef = useRef(null);

  const [selectedWiki, setSelectedWiki] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [deletingWiki, setDeletingWiki] = useState(false);

  // Modal-state ('edit' | 'adduser' | 'addgroup' | 'removecollab' | 'delete' | null)
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

  // Cooldown / debounce på sökfältet
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setDebouncedSearch('');
      return undefined;
    }

    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchWikisBatch = useCallback(
    async ({ nextOffset = 0, reset = false } = {}) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        setError(null);
        if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const data = await api('w_wiki_list', 'GET', {
          limit: WIKIS_LIMIT,
          offset: nextOffset,
          mine: onlyMine ? 1 : 0,
        });

        const hasValidPayload =
          data?.success ||
          Array.isArray(data?.wikis) ||
          Array.isArray(data?.list) ||
          Array.isArray(data);

        if (hasValidPayload) {
          const batch = data.wikis || data.list || (Array.isArray(data) ? data : []);
          const nextList = reset ? batch : mergeUniqueWikis(wikis, batch);

          setWikis(nextList);
          setOffset(nextOffset + batch.length);
          setHasMore(batch.length === WIKIS_LIMIT);

          setSelectedWiki((prevSelected) => {
            if (!prevSelected) return null;
            const currentId = getWikiId(prevSelected);
            return nextList.find((w) => String(getWikiId(w)) === String(currentId)) || null;
          });
        } else {
          if (reset) setWikis([]);
          setHasMore(false);
          setError(data?.error || 'Kunde inte hämta wikis.');
        }
      } catch (err) {
        if (reset) setWikis([]);
        setError(err?.message || 'Ett fel uppstod vid hämtning av wikis.');
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [onlyMine, wikis]
  );

  async function fetchAllUsersAndGroups() {
    try {
      setLoadingUsers(true);
      setLoadingGroups(true);

      const usersRes = await api('listusers', 'GET', {
        limit: USERS_LIMIT,
        offset: 0,
      });
      if (usersRes?.success) setAllUsers(usersRes.users || []);

      const groupsRes = await api('g_list', 'GET');
      if (groupsRes?.success) {
        setAllGroups(groupsRes.groups || groupsRes.list || []);
      }
    } catch (err) {
      console.error('Kunde inte hämta metadata:', err);
    } finally {
      setLoadingUsers(false);
      setLoadingGroups(false);
    }
  }

  // Ladda första batchen när komponenten monteras eller when onlyMine ändras
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    setSelectedWiki(null);
    if (listContainerRef.current) {
      listContainerRef.current.scrollTop = 0;
    }
    fetchWikisBatch({ nextOffset: 0, reset: true });
  }, [onlyMine]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAllUsersAndGroups();
  }, []);

  // Fortsätt hämta fler batcher vid sökning om ingen matchning hittats i redan laddade wikis
  useEffect(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q || loading || loadingMore || !hasMore) return;

    const alreadyMatched = wikis.some((w) =>
      (w.title || w.name || '').toLowerCase().includes(q)
    );

    if (!alreadyMatched) {
      fetchWikisBatch({ nextOffset: offset, reset: false });
    }
  }, [debouncedSearch, wikis, loading, loadingMore, hasMore, offset, fetchWikisBatch]);

  function handleListScroll(event) {
    const el = event.currentTarget;
    if (!hasMore || loading || loadingMore || isFetchingRef.current) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom <= SCROLL_THRESHOLD_PX) {
      fetchWikisBatch({ nextOffset: offset, reset: false });
    }
  }

  async function refreshWikisFromStart(keepSelectedId = null) {
    setOffset(0);
    setHasMore(true);
    if (listContainerRef.current) {
      listContainerRef.current.scrollTop = 0;
    }
    isFetchingRef.current = false;

    try {
      setLoading(true);
      setError(null);
      const data = await api('w_wiki_list', 'GET', {
        limit: WIKIS_LIMIT,
        offset: 0,
        mine: onlyMine ? 1 : 0,
      });

      const batch = data?.wikis || data?.list || (Array.isArray(data) ? data : []);
      setWikis(batch);
      setOffset(batch.length);
      setHasMore(batch.length === WIKIS_LIMIT);

      if (keepSelectedId != null) {
        setSelectedWiki(
          batch.find((w) => String(getWikiId(w)) === String(keepSelectedId)) || null
        );
      } else {
        setSelectedWiki(null);
      }
    } catch (err) {
      setError(err?.message || 'Ett fel uppstod vid uppdatering av wikis.');
    } finally {
      setLoading(false);
    }
  }

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
    setDeletingWiki(false);
    setSelectedUsernames([]);
    setSelectedGroupNames([]);
    setSelectedCollabsToRemove([]);
  }

  // Hantera redigering av wiki (w_wiki_update)
  async function handleUpdateWiki(e) {
    e.preventDefault();
    if (!selectedWiki) return;
    const wikiId = getWikiId(selectedWiki);
    try {
      const res = await api('w_wiki_update', 'POST', {
        wiki_id: wikiId,
        title: editTitle,
        status: editStatus,
        tags: editTags,
      });

      if (res.success || res.message) {
        closeModal();
        await refreshWikisFromStart(wikiId);
        showTemporarySuccess(`Wikisidan "${editTitle}" har uppdaterats!`);
      } else {
        setActionMessage(res.error || res.message || 'Kunde inte uppdatera wikisidan.');
      }
    } catch (err) {
      setActionMessage(err.message || 'Ett fel uppstod.');
    }
  }

  // Hantera borttagning av wiki
  async function handleDeleteWiki() {
    if (!selectedWiki) return;
    const wikiId = getWikiId(selectedWiki);
    const wikiName = selectedWiki.title || selectedWiki.name || `ID ${wikiId}`;

    try {
      setDeletingWiki(true);
      setActionMessage(null);
      const res = await api('w_wiki_delete', 'POST', {
        wiki_id: wikiId,
      });

      if (res && (res.success || res.message)) {
        closeModal();
        await refreshWikisFromStart(null);
        showTemporarySuccess(`Wikisidan "${wikiName}" har tagits bort.`);
      } else {
        setActionMessage(res?.error || res?.message || 'Kunde inte ta bort wikisidan.');
      }
    } catch (err) {
      setActionMessage(err.message || 'Ett fel uppstod vid borttagning.');
    } finally {
      setDeletingWiki(false);
    }
  }

  // Lägg till valda användare som collaborators
  async function handleAddCollaborators() {
    if (!selectedWiki || selectedUsernames.length === 0) return;
    const wikiId = getWikiId(selectedWiki);

    try {
      let count = 0;
      for (const username of selectedUsernames) {
        const res = await api('w_add_contributor', 'POST', {
          wiki_id: wikiId,
          username,
        });
        if (res && (res.success || res.message)) count++;
      }
      closeModal();
      await refreshWikisFromStart(wikiId);
      showTemporarySuccess(`Lade till ${count} användare som collaborators!`);
    } catch (err) {
      setActionMessage(err.message || 'Ett fel uppstod.');
    }
  }

  // Lägg till valda grupper som collaborators
  async function handleAddGroupCollaborators() {
    if (!selectedWiki || selectedGroupNames.length === 0) return;
    const wikiId = getWikiId(selectedWiki);

    try {
      let count = 0;
      for (const group of selectedGroupNames) {
        const res = await api('w_add_contributor', 'POST', {
          wiki_id: wikiId,
          group,
        });
        if (res && (res.success || res.message)) count++;
      }
      closeModal();
      await refreshWikisFromStart(wikiId);
      showTemporarySuccess(`Lade till ${count} grupper som collaborators!`);
    } catch (err) {
      setActionMessage(err.message || 'Ett fel uppstod.');
    }
  }

  const activeFilterQuery = searchQuery.trim().toLowerCase();
  const filteredWikis = wikis.filter((w) => {
    const title = w.title || w.name || '';
    return title.toLowerCase().includes(activeFilterQuery);
  });

  const selectedWikiTitle = selectedWiki ? selectedWiki.title || selectedWiki.name : '';
  const selectedWikiId = selectedWiki ? getWikiId(selectedWiki) : null;

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
            <p>Inloggad som {me?.username}. Välj en wiki nedan för att hantera dess inställningar och behörigheter.</p>
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
                {selectedWiki
                  ? 'Använd knapparna för att redigera, hantera behörigheter eller ta bort wikin.'
                  : 'Klicka på en wiki i listan nedan för att välja.'}
              </p>
            </div>

            <div className="action-buttons">
              <button
                type="button"
                disabled={!selectedWiki}
                onClick={() => {
                  setActiveModal('edit');
                  setActionMessage(null);
                }}
                className="btn btn-primary"
              >
                Edit wiki
              </button>
              <button
                type="button"
                disabled={!selectedWiki}
                onClick={() => {
                  setSelectedUsernames([]);
                  setActionMessage(null);
                  setActiveModal('adduser');
                }}
                className="btn btn-info"
              >
                Add collaborator
              </button>
              <button
                type="button"
                disabled={!selectedWiki}
                onClick={() => {
                  setSelectedGroupNames([]);
                  setActionMessage(null);
                  setActiveModal('addgroup');
                }}
                className="btn btn-success"
              >
                Add collaborator group
              </button>
              <button
                type="button"
                disabled={!selectedWiki}
                onClick={() => {
                  setSelectedCollabsToRemove([]);
                  setActionMessage(null);
                  setActiveModal('removecollab');
                }}
                className="btn btn-secondary"
              >
                Remove collaborator
              </button>
              <button
                type="button"
                disabled={!selectedWiki}
                onClick={() => {
                  setActionMessage(null);
                  setActiveModal('delete');
                }}
                className="btn btn-danger"
              >
                Delete wiki
              </button>
            </div>
          </div>
        </section>

        {/* Wikilista */}
        <section className="admin-section">
          <h2>
            Wikilista ({filteredWikis.length}
            {hasMore ? '+' : ''})
          </h2>

          {loading && <p>Laddar wikis...</p>}
          {error && <p className="error-text">{error}</p>}

          {!loading && !error && (
            <div
              ref={listContainerRef}
              onScroll={handleListScroll}
              className="scrollable-list"
            >
              <div className="list-grid">
                {filteredWikis.length > 0 ? (
                  filteredWikis.map((w, index) => {
                    const title = w.title || w.name || 'Okänd wiki';
                    const wikiKey = getWikiId(w) ?? index;
                    const isSelected = String(selectedWikiId) === String(getWikiId(w));
                    const owner = w.owner_username || 'Okänd';

                    return (
                      <div
                        key={wikiKey}
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

              {loadingMore && (
                <p className="subtext" style={{ textAlign: 'center', marginTop: '12px' }}>
                  Hämtar fler wikis...
                </p>
              )}

              {!hasMore && filteredWikis.length > 0 && (
                <p className="subtext" style={{ textAlign: 'center', marginTop: '12px' }}>
                  Alla wikis är visade.
                </p>
              )}
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

      {/* MODAL: DELETE WIKI */}
      {activeModal === 'delete' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Ta bort wiki</h3>
            <p className="subtext">
              Är du säker på att du vill ta bort <strong>{selectedWikiTitle}</strong> (ID: {selectedWikiId})? Detta går inte att ångra.
            </p>
            {actionMessage && <p className="error-text">{actionMessage}</p>}

            <div className="modal-actions">
              <button
                type="button"
                onClick={closeModal}
                disabled={deletingWiki}
                className="btn btn-secondary"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={handleDeleteWiki}
                disabled={deletingWiki}
                className="btn btn-danger"
              >
                {deletingWiki ? 'Tar bort...' : 'Ta bort wiki'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD COLLABORATOR (Användare) */}
      {activeModal === 'adduser' && (
        <SelectionModal
          title={`Lägg till användare på ${selectedWikiTitle}`}
          items={allUsers.filter((u) => !u.banned_at)}
          selectedItems={selectedUsernames}
          onToggleItem={(username) => {
            setSelectedUsernames((prev) =>
              prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]
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
            const name = typeof groupName === 'string' ? groupName : groupName.name || groupName.group || '';
            setSelectedGroupNames((prev) =>
              prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name]
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
            setSelectedCollabsToRemove((prev) =>
              prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]
            );
          }}
          onConfirm={async () => {
            if (selectedCollabsToRemove.length === 0) return;
            const wikiId = getWikiId(selectedWiki);
            try {
              let count = 0;
              for (const username of selectedCollabsToRemove) {
                const res = await api('w_remove_contributor', 'POST', {
                  wiki_id: wikiId,
                  username,
                });
                if (res && (res.success || res.message)) {
                  count++;
                }
              }
              closeModal();
              await refreshWikisFromStart(wikiId);
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
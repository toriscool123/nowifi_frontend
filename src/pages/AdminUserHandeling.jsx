import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';

const USERS_LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 300;
const SCROLL_THRESHOLD_PX = 80;

function mergeUniqueUsers(existing, incoming) {
  const map = new Map();

  for (const u of existing) {
    const key = u.id ?? u.username;
    map.set(String(key), u);
  }

  for (const u of incoming) {
    const key = u.id ?? u.username;
    map.set(String(key), u);
  }

  return Array.from(map.values());
}

export default function AdminHandleUsers({ me, onBack, onLogout }) {
  const [users, setUsers] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const isFetchingRef = useRef(false);
  const listContainerRef = useRef(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'create' | 'edit' | 'ban' | null

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');

  const [createUsername, setCreateUsername] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState('user');

  const [actionMessage, setActionMessage] = useState(null);

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

  const fetchUsersBatch = useCallback(async ({ nextOffset = 0, reset = false } = {}) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      setError(null);
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const data = await api('listusers', 'GET', {
        limit: USERS_LIMIT,
        offset: nextOffset,
      });

      if (data?.success && Array.isArray(data.users)) {
        const batch = data.users;
        setUsers((prev) => (reset ? batch : mergeUniqueUsers(prev, batch)));
        setOffset(nextOffset + batch.length);
        setHasMore(batch.length === USERS_LIMIT);
      } else {
        if (reset) setUsers([]);
        setHasMore(false);
        setError(data?.error || 'Kunde inte hämta användare.');
      }
    } catch (err) {
      if (reset) setUsers([]);
      setError(err?.message || 'Ett fel uppstod vid hämtning.');
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchUsersBatch({ nextOffset: 0, reset: true });
  }, [fetchUsersBatch]);

  useEffect(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q || loading || loadingMore || !hasMore) return;

    const alreadyMatched = users.some((u) =>
      (u.username || '').toLowerCase().includes(q)
    );

    if (!alreadyMatched) {
      fetchUsersBatch({ nextOffset: offset, reset: false });
    }
  }, [debouncedSearch, users, loading, loadingMore, hasMore, offset, fetchUsersBatch]);

  function handleListScroll(event) {
    const el = event.currentTarget;
    if (!hasMore || loading || loadingMore || isFetchingRef.current) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom <= SCROLL_THRESHOLD_PX) {
      fetchUsersBatch({ nextOffset: offset, reset: false });
    }
  }

  async function refreshFromStart() {
    setSelectedUser(null);
    setOffset(0);
    setHasMore(true);
    if (listContainerRef.current) {
      listContainerRef.current.scrollTop = 0;
    }
    await fetchUsersBatch({ nextOffset: 0, reset: true });
  }

  function openCreateModal() {
    setCreateUsername('');
    setCreatePassword('');
    setCreateRole('user');
    setActiveModal('create');
    setActionMessage(null);
  }

  function openEditModal() {
    if (!selectedUser || selectedUser.role === 'superadmin') return;
    setNewUsername(selectedUser.username);
    setNewPassword('');
    setNewRole(selectedUser.role || 'user');
    setActiveModal('edit');
    setActionMessage(null);
  }

  function openBanModal() {
    if (!selectedUser || selectedUser.role === 'superadmin') return;
    setActiveModal('ban');
    setActionMessage(null);
  }

  function closeModal() {
    setActiveModal(null);
    setActionMessage(null);
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    try {
      const res = await api('adduser', 'POST', {
        username: createUsername,
        password: createPassword,
        role: createRole,
      });

      if (res.success) {
        closeModal();
        refreshFromStart();
      } else {
        setActionMessage(res.error || 'Kunde inte skapa användaren.');
      }
    } catch (err) {
      setActionMessage(err.message || 'Ett fel uppstod.');
    }
  }

  async function handleUpdateUser(e) {
    e.preventDefault();
    if (!selectedUser || selectedUser.role === 'superadmin') return;
    try {
      const fields = {
        username: selectedUser.username,
        new_username: newUsername,
        role: newRole,
      };
      if (newPassword.trim() !== '') {
        fields.password = newPassword;
      }

      const res = await api('userupdate', 'POST', fields);
      if (res.success) {
        closeModal();
        refreshFromStart();
      } else {
        setActionMessage(res.error || 'Kunde inte uppdatera användaren.');
      }
    } catch (err) {
      setActionMessage(err.message || 'Ett fel uppstod.');
    }
  }

  async function handleToggleBan() {
    if (!selectedUser || selectedUser.role === 'superadmin') return;
    const isBanned = !!selectedUser.banned_at;
    const op = isBanned ? 'unbanuser' : 'banuser';

    try {
      const res = await api(op, 'POST', { username: selectedUser.username });
      if (res.success) {
        closeModal();
        refreshFromStart();
      } else {
        setActionMessage(res.error || 'Åtgärden misslyckades.');
      }
    } catch (err) {
      setActionMessage(err.message || 'Ett fel uppstod.');
    }
  }

  const activeFilterQuery = searchQuery.trim().toLowerCase();
  const filteredUsers = users.filter((u) =>
    (u.username || '').toLowerCase().includes(activeFilterQuery)
  );

  const isBanned = selectedUser ? !!selectedUser.banned_at : false;
  const isSuperAdmin = selectedUser?.role === 'superadmin';

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
            <h1>Hantera användare</h1>
            <p>Klicka på en användare i listan för att välja den, och använd sedan knapparna nedan.</p>
          </section>

          <button type="button" onClick={openCreateModal} className="btn btn-primary">
            Skapa användare
          </button>
        </div>

        <section className="wiki-tools" style={{ marginBottom: '20px' }}>
          <label className="search-field">
            <span className="visually-hidden">Sök användare</span>
            <input
              type="search"
              placeholder="Sök användarnamn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
            />
          </label>
        </section>

        <section className={`admin-section ${selectedUser ? 'active-panel' : 'inactive-panel'}`}>
          <div className="panel-header">
            <div>
              <h3>{selectedUser ? `Vald användare: ${selectedUser.username}` : 'Ingen användare vald'}</h3>
              <p className="subtext">
                {selectedUser ? `Roll: ${selectedUser.role || 'user'}` : 'Klicka på ett kort i listan nedan för att välja.'}
              </p>
            </div>

            <div className="action-buttons">
              <button
                type="button"
                disabled={!selectedUser || isSuperAdmin}
                onClick={openEditModal}
                className="btn btn-primary"
              >
                Redigera användare
              </button>
              <button
                type="button"
                disabled={!selectedUser || isSuperAdmin}
                onClick={openBanModal}
                className={`btn ${isBanned ? 'btn-success' : 'btn-danger'}`}
              >
                {isBanned ? 'Återaktivera' : 'Stäng av'}
              </button>
            </div>
          </div>
        </section>

        <section className="admin-section">
          <h2>
            Användarlista ({filteredUsers.length}
            {hasMore ? '+' : ''})
          </h2>

          {loading && <p>Laddar användare...</p>}
          {error && <p className="error-text">{error}</p>}

          {!loading && !error && (
            <div
              ref={listContainerRef}
              onScroll={handleListScroll}
              className="scrollable-list"
            >
              <div className="list-grid">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => {
                    const isSelected = selectedUser?.username === u.username;
                    const userBanned = !!u.banned_at;

                    return (
                      <div
                        key={u.id ?? u.username}
                        onClick={() => setSelectedUser(u)}
                        className={`list-item ${isSelected ? 'selected' : ''}`}
                      >
                        <div>
                          <strong>{u.username}</strong>
                          <div className="subtext">
                            Roll: {u.role || 'user'}
                            {userBanned && (
                              <span className="error-text" style={{ marginLeft: '8px', fontWeight: 600 }}>
                                (Avstängd)
                              </span>
                            )}
                          </div>
                        </div>

                        {isSelected && <span className="selected-indicator">Vald ✓</span>}
                      </div>
                    );
                  })
                ) : (
                  <p className="subtext">Inga användare matchade din sökning.</p>
                )}
              </div>

              {loadingMore && (
                <p className="subtext" style={{ textAlign: 'center', marginTop: '12px' }}>
                  Hämtar fler användare...
                </p>
              )}

              {!hasMore && filteredUsers.length > 0 && (
                <p className="subtext" style={{ textAlign: 'center', marginTop: '12px' }}>
                  Alla användare är visade.
                </p>
              )}
            </div>
          )}
        </section>
      </main>

      {activeModal === 'create' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Skapa ny användare</h3>
            {actionMessage && <p className="error-text">{actionMessage}</p>}

            <form onSubmit={handleCreateUser} className="modal-form">
              <label className="form-label">
                Användarnamn:
                <input
                  type="text"
                  placeholder="Ange användarnamn"
                  value={createUsername}
                  onChange={(e) => setCreateUsername(e.target.value)}
                  required
                  className="form-input"
                />
              </label>

              <label className="form-label">
                Lösenord:
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minst 8 tecken"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  required
                  className="form-input"
                />
              </label>

              <label className="form-label">
                Roll:
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value)}
                  className="form-input"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </label>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn btn-secondary">Avbryt</button>
                <button type="submit" className="btn btn-primary">Skapa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'edit' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Redigera användare: {selectedUser?.username}</h3>
            {actionMessage && <p className="error-text">{actionMessage}</p>}

            <form onSubmit={handleUpdateUser} className="modal-form">
              <label className="form-label">
                Användarnamn:
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  className="form-input"
                />
              </label>

              <label className="form-label">
                Nytt lösenord (lämna tomt för att behålla):
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minst 8 tecken"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                />
              </label>

              <label className="form-label">
                Roll:
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="form-input"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </label>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn btn-secondary">Avbryt</button>
                <button type="submit" className="btn btn-primary">Spara ändringar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'ban' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{isBanned ? 'Återaktivera användare' : 'Stäng av användare'}</h3>
            <p className="subtext">
              Är du säker på att du vill {isBanned ? 'återaktivera' : 'stänga av'}{' '}
              <strong>{selectedUser?.username}</strong>?
            </p>
            {actionMessage && <p className="error-text">{actionMessage}</p>}

            <div className="modal-actions">
              <button type="button" onClick={closeModal} className="btn btn-secondary">Avbryt</button>
              <button
                type="button"
                onClick={handleToggleBan}
                className={`btn ${isBanned ? 'btn-success' : 'btn-danger'}`}
              >
                {isBanned ? 'Ja, återaktivera' : 'Ja, stäng av'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
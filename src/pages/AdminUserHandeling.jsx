import { useState, useEffect } from 'react';
import { api } from '../api';

export default function AdminUserHandeling({ me, onBack, onLogout }) {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Markerad användare
  const [selectedUser, setSelectedUser] = useState(null);

  // Modal-state ('edit' | 'ban' | 'create' | null)
  const [activeModal, setActiveModal] = useState(null);

  // Form-state för redigering
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');

  // Form-state för att skapa ny användare
  const [createUsername, setCreateUsername] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState('user');

  const [actionMessage, setActionMessage] = useState(null);

  // Hämta användarlistan
  async function fetchUsers() {
    try {
      setLoading(true);
      const data = await api('listusers', 'GET');
      if (data.success) {
        setUsers(data.users || []);
      } else {
        setError('Kunde inte hämta användare.');
      }
    } catch (err) {
      setError(err.message || 'Ett fel uppstod vid hämtning.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  function openCreateModal() {
    setCreateUsername('');
    setCreatePassword('');
    setCreateRole('user');
    setActiveModal('create');
    setActionMessage(null);
  }

  function openEditModal() {
    if (!selectedUser) return;
    setNewUsername(selectedUser.username);
    setNewPassword('');
    setNewRole(selectedUser.role || 'user');
    setActiveModal('edit');
    setActionMessage(null);
  }

  function openBanModal() {
    if (!selectedUser) return;
    setActiveModal('ban');
    setActionMessage(null);
  }

  function closeModal() {
    setActiveModal(null);
    setActionMessage(null);
  }

  // Skapa ny användare (adduser)
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
        fetchUsers();
      } else {
        setActionMessage(res.error || 'Kunde inte skapa användaren.');
      }
    } catch (err) {
      setActionMessage(err.message || 'Ett fel uppstod.');
    }
  }

  // Uppdatera användare (userupdate)
  async function handleUpdateUser(e) {
    e.preventDefault();
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
        setSelectedUser(null);
        fetchUsers();
      } else {
        setActionMessage(res.error || 'Kunde inte uppdatera användaren.');
      }
    } catch (err) {
      setActionMessage(err.message || 'Ett fel uppstod.');
    }
  }

  // Banna / Avbanna
  async function handleToggleBan() {
    const isBanned = !!selectedUser.banned_at;
    const op = isBanned ? 'unbanuser' : 'banuser';

    try {
      const res = await api(op, 'POST', { username: selectedUser.username });
      if (res.success) {
        closeModal();
        setSelectedUser(null);
        fetchUsers();
      } else {
        setActionMessage(res.error || 'Åtgärden misslyckades.');
      }
    } catch (err) {
      setActionMessage(err.message || 'Ett fel uppstod.');
    }
  }

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const isBanned = selectedUser ? !!selectedUser.banned_at : false;

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

          <button
            type="button"
            onClick={openCreateModal}
            className="btn btn-primary"
          >
            Skapa användare
          </button>
        </div>

        {/* Söksektion */}
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

        {/* ÅTGÄRDSKNAPPAR FÖR VALD ANVÄNDARE */}
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
                disabled={!selectedUser}
                onClick={openEditModal}
                className="btn btn-primary"
              >
                Redigera användare
              </button>
              <button
                type="button"
                disabled={!selectedUser}
                onClick={openBanModal}
                className={`btn ${isBanned ? 'btn-success' : 'btn-danger'}`}
              >
                {isBanned ? 'Återaktivera' : 'Stäng av'}
              </button>
            </div>
          </div>
        </section>

        {/* ANVÄNDARLISTA MED SCROLLVIEWER */}
        <section className="admin-section">
          <h2>Användarlista ({filteredUsers.length})</h2>

          {loading && <p>Laddar användare...</p>}
          {error && <p className="error-text">{error}</p>}

          {!loading && !error && (
            <div className="scrollable-list">
              <div className="list-grid">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u, index) => {
                    const isSelected = selectedUser?.username === u.username;
                    const userBanned = !!u.banned_at;

                    return (
                      <div
                        key={index}
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
                        
                        {isSelected && (
                          <span className="selected-indicator">Vald ✓</span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="subtext">Inga användare matchade din sökning.</p>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* MODAL FÖR SKAPA ANVÄNDARE (adduser) */}
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

      {/* MODAL FÖR REDIGERING (userupdate) */}
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

      {/* MODAL FÖR BAN / UNBAN */}
      {activeModal === 'ban' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>
              {isBanned ? 'Återaktivera användare' : 'Stäng av användare'}
            </h3>
            <p className="subtext">
              Är du säker på att du vill {isBanned ? 'återaktivera' : 'stänga av'} <strong>{selectedUser?.username}</strong>?
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
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
          <button className="text-button" type="button" onClick={onBack}>
            ← Tillbaka till Admin
          </button>
          <button className="text-button" type="button" onClick={onLogout}>
            Logga ut
          </button>
        </div>
      </header>

      <main className="home-content">
        {/* Rubrik och "Skapa användare"-knapp i rad */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
          <section className="wiki-heading" style={{ marginBottom: 0 }}>
            <p className="eyebrow">ADMINISTRATION</p>
            <h1>Hantera användare</h1>
            <p style={{ margin: 0 }}>Klicka på en användare i listan för att välja den, och använd sedan knapparna nedan.</p>
          </section>

          <button
            type="button"
            onClick={openCreateModal}
            style={{
              padding: '10px 20px',
              background: '#17243b',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.95rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            Skapa användare
          </button>
        </div>

        {/* Söksektion */}
        <section className="wiki-tools" style={{ marginBottom: '20px' }}>
          <label className="search-field" style={{ width: '100%' }}>
            <span className="visually-hidden">Sök användare</span>
            <input
              type="search"
              placeholder="Sök användarnamn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
        </section>

        {/* ÅTGÄRDSKNAPPAR FÖR VALD ANVÄNDARE */}
        <section 
          className="admin-section" 
          style={{ 
            marginBottom: '20px', 
            background: selectedUser ? '#f8fafc' : '#f1f5f9',
            border: selectedUser ? '1px solid #cbd5e1' : '1px dashed #cbd5e1',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#17243b' }}>
                {selectedUser ? `Vald användare: ${selectedUser.username}` : 'Ingen användare vald'}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                {selectedUser ? `Roll: ${selectedUser.role || 'user'}` : 'Klicka på ett kort i listan nedan för att välja.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                disabled={!selectedUser}
                onClick={openEditModal}
                style={{
                  ...actionButtonStyle,
                  background: selectedUser ? '#17243b' : '#cbd5e1',
                  cursor: selectedUser ? 'pointer' : 'not-allowed'
                }}
              >
                Redigera användare
              </button>
              <button
                type="button"
                disabled={!selectedUser}
                onClick={openBanModal}
                style={{
                  ...actionButtonStyle,
                  background: !selectedUser ? '#cbd5e1' : isBanned ? '#18864b' : '#b42318',
                  cursor: selectedUser ? 'pointer' : 'not-allowed'
                }}
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
          {error && <p style={{ color: '#b42318' }}>{error}</p>}

          {!loading && !error && (
            <div 
              style={{ 
                maxHeight: '400px', 
                overflowY: 'auto', 
                paddingRight: '4px',
                marginTop: '16px' 
              }}
            >
              <div style={{ display: 'grid', gap: '10px' }}>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u, index) => {
                    const isSelected = selectedUser?.username === u.username;
                    const userBanned = !!u.banned_at;

                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedUser(u)}
                        style={{
                          padding: '14px 16px',
                          background: isSelected ? '#eff6ff' : '#fff',
                          border: isSelected ? '2px solid #2563eb' : '1px solid #d5deeb',
                          borderRadius: '10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '1.05rem', color: '#17243b' }}>{u.username}</strong>
                          <div style={{ fontSize: '0.85rem', color: '#6b7890', marginTop: '4px' }}>
                            Roll: {u.role || 'user'}
                            {userBanned && (
                              <span style={{ color: '#b42318', marginLeft: '8px', fontWeight: 600 }}>
                                (Avstängd)
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {isSelected && (
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2563eb', background: '#dbeafe', padding: '4px 8px', borderRadius: '6px' }}>
                            Vald ✓
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: '#6b7890' }}>Inga användare matchade din sökning.</p>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* MODAL FÖR SKAPA ANVÄNDARE (adduser) */}
      {activeModal === 'create' && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3>Skapa ny användare</h3>
            {actionMessage && <p style={{ color: '#b42318', fontSize: '0.9rem', marginTop: '8px' }}>{actionMessage}</p>}
            
            <form onSubmit={handleCreateUser} style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
              <label style={{ display: 'grid', gap: '4px', fontSize: '0.9rem' }}>
                Användarnamn:
                <input
                  type="text"
                  placeholder="Ange användarnamn"
                  value={createUsername}
                  onChange={(e) => setCreateUsername(e.target.value)}
                  required
                  style={inputStyle}
                />
              </label>

              <label style={{ display: 'grid', gap: '4px', fontSize: '0.9rem' }}>
                Lösenord:
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minst 8 tecken"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  required
                  style={inputStyle}
                />
              </label>

              <label style={{ display: 'grid', gap: '4px', fontSize: '0.9rem' }}>
                Roll:
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value)}
                  style={inputStyle}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={closeModal} style={cancelButtonStyle}>Avbryt</button>
                <button type="submit" style={submitButtonStyle}>Skapa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FÖR REDIGERING (userupdate) */}
      {activeModal === 'edit' && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3>Redigera användare: {selectedUser?.username}</h3>
            {actionMessage && <p style={{ color: '#b42318', fontSize: '0.9rem', marginTop: '8px' }}>{actionMessage}</p>}
            
            <form onSubmit={handleUpdateUser} style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
              <label style={{ display: 'grid', gap: '4px', fontSize: '0.9rem' }}>
                Användarnamn:
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  style={inputStyle}
                />
              </label>

              <label style={{ display: 'grid', gap: '4px', fontSize: '0.9rem' }}>
                Nytt lösenord (lämna tomt för att behålla):
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minst 8 tecken"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={inputStyle}
                />
              </label>

              <label style={{ display: 'grid', gap: '4px', fontSize: '0.9rem' }}>
                Roll:
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  style={inputStyle}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={closeModal} style={cancelButtonStyle}>Avbryt</button>
                <button type="submit" style={submitButtonStyle}>Spara ändringar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FÖR BAN / UNBAN */}
      {activeModal === 'ban' && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3>
              {isBanned ? 'Återaktivera användare' : 'Stäng av användare'}
            </h3>
            <p style={{ marginTop: '10px', color: '#475569' }}>
              Är du säker på att du vill {isBanned ? 'återaktivera' : 'stänga av'} <strong>{selectedUser?.username}</strong>?
            </p>
            {actionMessage && <p style={{ color: '#b42318', fontSize: '0.9rem', marginTop: '8px' }}>{actionMessage}</p>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={closeModal} style={cancelButtonStyle}>Avbryt</button>
              <button
                type="button"
                onClick={handleToggleBan}
                style={{
                  ...submitButtonStyle,
                  background: isBanned ? '#18864b' : '#b42318'
                }}
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

// Stylingvariabler
const actionButtonStyle = {
  padding: '8px 16px',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontWeight: 600,
  fontSize: '0.9rem'
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modalContentStyle = {
  background: '#fff',
  padding: '24px',
  borderRadius: '12px',
  width: '100%',
  maxWidth: '400px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
};

const inputStyle = {
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  fontSize: '1rem',
  width: '100%'
};

const cancelButtonStyle = {
  padding: '8px 16px',
  background: '#f1f5f9',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 600,
  color: '#475569'
};

const submitButtonStyle = {
  padding: '8px 16px',
  background: '#17243b',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 600
};
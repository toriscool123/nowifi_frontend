import { useState, useEffect } from 'react';
import { api } from '../api';

export default function AdminGroupHandeling({ me, onBack, onLogout }) {
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Markerad grupp och dess medlemmar
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Modal-state ('create' | 'adduser' | 'removeuser' | 'deletegroup' | null)
  const [activeModal, setActiveModal] = useState(null);
  
  // Form-states
  const [createGroupName, setCreateGroupName] = useState('');
  const [actionMessage, setActionMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // States för användarlistan i modalen
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsernames, setSelectedUsernames] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Hämta grupper
  async function fetchGroups() {
    try {
      setLoading(true);
      const data = await api('g_list', 'GET');
      if (data.success) {
        setGroups(data.groups || data.list || []);
      } else {
        setError('Kunde inte hämta grupper.');
      }
    } catch (err) {
      setError(err.message || 'Ett fel uppstod vid hämtning av grupper.');
    } finally {
      setLoading(false);
    }
  }

  // Hämta medlemmar för vald grupp
  async function fetchGroupMembers(groupName) {
    if (!groupName) {
      setGroupMembers([]);
      return;
    }
    try {
      setLoadingMembers(true);
      const data = await api('g_list_members', 'GET', { group: groupName });
      if (data.success) {
        const parsedMembers = (data.members || []).map(m => typeof m === 'string' ? m : (m.username || m.name || ''));
        setGroupMembers(parsedMembers);
      }
    } catch (err) {
      console.error('Kunde inte hämta gruppens medlemmar:', err);
    } finally {
      setLoadingMembers(false);
    }
  }

  // Hämta alla användare
  async function fetchAllUsers() {
    try {
      setLoadingUsers(true);
      const data = await api('listusers', 'GET');
      if (data.success) {
        setAllUsers(data.users || []);
      }
    } catch (err) {
      console.error('Kunde inte hämta användare:', err);
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    fetchGroups();
  }, []);

  // När selectedGroup ändras, hämta dess medlemmar
  useEffect(() => {
    const groupName = selectedGroup ? (typeof selectedGroup === 'string' ? selectedGroup : (selectedGroup.name || selectedGroup.group)) : '';
    if (groupName) {
      fetchGroupMembers(groupName);
    } else {
      setGroupMembers([]);
    }
  }, [selectedGroup]);

  function closeModal() {
    setActiveModal(null);
    setActionMessage(null);
    setSelectedUsernames([]);
    setUserSearchQuery('');
  }

  function showTemporarySuccess(msg) {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  }

  async function openAddUserModal() {
    setActiveModal('adduser');
    setActionMessage(null);
    setSelectedUsernames([]);
    setUserSearchQuery('');
    await fetchAllUsers();
  }

  function openRemoveUserModal() {
    setActiveModal('removeuser');
    setActionMessage(null);
    setSelectedUsernames([]);
    setUserSearchQuery('');
  }

  // Skapa grupp
  async function handleCreateGroup(e) {
    e.preventDefault();
    try {
      const res = await api('g_create', 'POST', {
        group: createGroupName,
      });

      if (res.success) {
        closeModal();
        fetchGroups();
        showTemporarySuccess(`Gruppen "${createGroupName}" skapades framgångsrikt!`);
      } else {
        setActionMessage(res.error || 'Kunde inte skapa gruppen.');
      }
    } catch (err) {
      setActionMessage(err.message || 'Ett fel uppstod.');
    }
  }

  // Växla checkbox för en användare
  function toggleUserCheckbox(username) {
    if (selectedUsernames.includes(username)) {
      setSelectedUsernames(selectedUsernames.filter((u) => u !== username));
    } else {
      setSelectedUsernames([...selectedUsernames, username]);
    }
  }

  // Lägg till valda användare i grupp (loopar igenom och skickar en i taget för att garantera att alla läggs till)
  async function handleAddUsersToGroup(e) {
    e.preventDefault();
    if (selectedUsernames.length === 0) {
      setActionMessage('Välj minst en användare.');
      return;
    }

    const groupName = typeof selectedGroup === 'string' ? selectedGroup : (selectedGroup.name || selectedGroup.group);
    
    try {
      let successCount = 0;
      for (const username of selectedUsernames) {
        const res = await api('g_add_member', 'POST', {
          group: groupName,
          username: username,
        });
        if (res.success || res.message) {
          successCount++;
        }
      }

      closeModal();
      fetchGroups();
      fetchGroupMembers(groupName);
      showTemporarySuccess(`Lade till ${successCount} användare i ${groupName}!`);
    } catch (err) {
      setActionMessage(err.message || 'Ett fel uppstod.');
    }
  }

  // Ta bort valda användare från grupp (loopar igenom och tar bort en i taget)
  async function handleRemoveUsersFromGroup(e) {
    e.preventDefault();
    if (selectedUsernames.length === 0) {
      setActionMessage('Välj minst en användare att ta bort.');
      return;
    }

    const groupName = typeof selectedGroup === 'string' ? selectedGroup : (selectedGroup.name || selectedGroup.group);
    
    try {
      let successCount = 0;
      for (const username of selectedUsernames) {
        const res = await api('g_remove_member', 'POST', {
          group: groupName,
          username: username,
        });
        if (res.success || res.message) {
          successCount++;
        }
      }

      closeModal();
      fetchGroups();
      fetchGroupMembers(groupName);
      showTemporarySuccess(`Tog bort ${successCount} medlemmar från ${groupName}!`);
    } catch (err) {
      setActionMessage(err.message || 'Ett fel uppstod.');
    }
  }

  // Ta bort enskild medlem direkt från medlemslistan
  async function handleRemoveSingleMember(username) {
    const groupName = selectedGroupName;
    try {
      const res = await api('g_remove_member', 'POST', {
        group: groupName,
        username: username,
      });

      if (res.success || res.message) {
        fetchGroupMembers(groupName);
        showTemporarySuccess(`Tog bort ${username} från ${groupName}.`);
      } else {
        setError(res.error || 'Kunde inte ta bort medlemmen.');
      }
    } catch (err) {
      setError(err.message || 'Ett fel uppstod.');
    }
  }

  // Ta bort grupp
  async function handleDeleteGroup() {
    const groupName = typeof selectedGroup === 'string' ? selectedGroup : (selectedGroup.name || selectedGroup.group);
    
    try {
      const res = await api('g_delete', 'POST', {
        group: groupName,
      });

      if (res.success) {
        closeModal();
        setSelectedGroup(null);
        setGroupMembers([]);
        fetchGroups();
        showTemporarySuccess(`Gruppen "${groupName}" har tagits bort.`);
      } else {
        setActionMessage(res.error || 'Kunde inte ta bort gruppen.');
      }
    } catch (err) {
      setActionMessage(err.message || 'Ett fel uppstod.');
    }
  }

  const filteredGroups = groups.filter((g) => {
    const name = typeof g === 'string' ? g : (g.name || g.group || '');
    return name.toLowerCase().includes(searchQuery.trim().toLowerCase());
  });

  const filteredModalUsers = allUsers
    .filter((u) => !u.banned_at) // Filtrera bort användare som har en banned_at-tidsstämpel
    .filter((u) => !groupMembers.includes(u.username)) // Filtrera bort de som redan är med i gruppen
    .filter((u) => u.username.toLowerCase().includes(userSearchQuery.trim().toLowerCase())); // Sökfilter

  const filteredGroupMembers = groupMembers.filter((username) =>
    username.toLowerCase().includes(userSearchQuery.trim().toLowerCase())
  );

  const selectedGroupName = selectedGroup ? (typeof selectedGroup === 'string' ? selectedGroup : (selectedGroup.name || selectedGroup.group)) : '';

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
        {/* Rubrik och "Skapa grupp"-knapp */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
          <section className="wiki-heading" style={{ marginBottom: 0 }}>
            <p className="eyebrow">ADMINISTRATION</p>
            <h1>Grupp hantering</h1>
            <p style={{ margin: 0 }}>Klicka på en grupp nedan för att hantera dess medlemmar eller ta bort den.</p>
          </section>

          <button
            type="button"
            onClick={() => { setCreateGroupName(''); setActiveModal('create'); setActionMessage(null); }}
            style={{
              padding: '10px 20px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.95rem',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
            }}
          >
            Skapa grupp
          </button>
        </div>

        {/* NOTIFIKATIONER / SUCCESS ALERT */}
        {successMessage && (
          <div style={{ 
            background: '#ecfdf5', 
            border: '1px solid #10b981', 
            color: '#065f46', 
            padding: '12px 16px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>✅</span> {successMessage}
          </div>
        )}

        {/* Söksektion */}
        <section className="wiki-tools" style={{ marginBottom: '20px' }}>
          <label className="search-field" style={{ width: '100%' }}>
            <span className="visually-hidden">Sök grupp</span>
            <input
              type="search"
              placeholder="Sök gruppnamn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
        </section>

        {/* ÅTGÄRDSPANEL FÖR VALD GRUPP OCH MEDLEMSLISTA */}
        <section 
          className="admin-section" 
          style={{ 
            marginBottom: '20px', 
            background: selectedGroup ? '#f8fafc' : '#f1f5f9',
            border: selectedGroup ? '1px solid #cbd5e1' : '1px dashed #cbd5e1',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: selectedGroup ? '16px' : 0 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#17243b' }}>
                {selectedGroup ? `Vald grupp: ${selectedGroupName}` : 'Ingen grupp vald'}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                {selectedGroup ? 'Hantera medlemmar eller ta bort gruppen nedan.' : 'Klicka på ett kort i listan nedan för att välja.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={!selectedGroup}
                onClick={openAddUserModal}
                style={{
                  ...actionButtonStyle,
                  background: selectedGroup ? '#2563eb' : '#cbd5e1',
                  cursor: selectedGroup ? 'pointer' : 'not-allowed'
                }}
              >
                Lägg till användare
              </button>
              <button
                type="button"
                disabled={!selectedGroup || groupMembers.length === 0}
                onClick={openRemoveUserModal}
                style={{
                  ...actionButtonStyle,
                  background: selectedGroup && groupMembers.length > 0 ? '#d97706' : '#cbd5e1',
                  cursor: selectedGroup && groupMembers.length > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                Ta bort användare
              </button>
              <button
                type="button"
                disabled={!selectedGroup}
                onClick={() => { setActiveModal('deletegroup'); setActionMessage(null); }}
                style={{
                  ...actionButtonStyle,
                  background: selectedGroup ? '#b42318' : '#cbd5e1',
                  cursor: selectedGroup ? 'pointer' : 'not-allowed'
                }}
              >
                Ta bort grupp
              </button>
            </div>
          </div>

          {/* MEDLEMSLISTA FÖR VALD GRUPP */}
          {selectedGroup && (
            <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '14px', marginTop: '14px' }}>
              <h4 style={{ fontSize: '0.95rem', color: '#17243b', marginBottom: '8px' }}>
                Medlemmar i gruppen ({groupMembers.length})
              </h4>
              {loadingMembers ? (
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Laddar medlemmar...</p>
              ) : groupMembers.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                  {groupMembers.map((username, idx) => (
                    <span 
                      key={idx} 
                      style={{ 
                        background: '#fff', 
                        border: '1px solid #cbd5e1', 
                        borderRadius: '6px', 
                        padding: '4px 10px', 
                        fontSize: '0.85rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontWeight: 500,
                        color: '#17243b'
                      }}
                    >
                      {username}
                      <button
                        type="button"
                        onClick={() => handleRemoveSingleMember(username)}
                        title={`Ta bort ${username}`}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#b42318',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          padding: 0,
                          lineHeight: 1
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>Inga medlemmar i denna grupp ännu.</p>
              )}
            </div>
          )}
        </section>

        {/* GRUPPLISTA MED SCROLLVIEWER */}
        <section className="admin-section">
          <h2>Grupplista ({filteredGroups.length})</h2>

          {loading && <p>Laddar grupper...</p>}
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
                {filteredGroups.length > 0 ? (
                  filteredGroups.map((g, index) => {
                    const groupName = typeof g === 'string' ? g : (g.name || g.group || 'Okänd grupp');
                    const isSelected = selectedGroupName === groupName;

                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedGroup(g)}
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
                          <strong style={{ fontSize: '1.05rem', color: '#17243b' }}>{groupName}</strong>
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
                  <p style={{ color: '#6b7890' }}>Inga grupper matchade din sökning.</p>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* MODAL: SKAPA GRUPP */}
      {activeModal === 'create' && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3>Skapa ny grupp</h3>
            {actionMessage && <p style={{ color: '#b42318', fontSize: '0.9rem', marginTop: '8px' }}>{actionMessage}</p>}
            
            <form onSubmit={handleCreateGroup} style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
              <label style={{ display: 'grid', gap: '4px', fontSize: '0.9rem' }}>
                Gruppnamn:
                <input
                  type="text"
                  placeholder="t.ex. ekonomi"
                  value={createGroupName}
                  onChange={(e) => setCreateGroupName(e.target.value)}
                  required
                  style={inputStyle}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={closeModal} style={cancelButtonStyle}>Avbryt</button>
                <button type="submit" style={submitButtonStyle}>Skapa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LÄGG TILL ANVÄNDARE */}
      {activeModal === 'adduser' && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: '450px' }}>
            <h3>Lägg till användare i {selectedGroupName}</h3>
            {actionMessage && <p style={{ color: '#b42318', fontSize: '0.9rem', marginTop: '8px' }}>{actionMessage}</p>}
            
            <form onSubmit={handleAddUsersToGroup} style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
              <input
                type="search"
                placeholder="Sök användare..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                style={{ ...inputStyle, marginBottom: '4px' }}
              />

              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px', display: 'grid', gap: '6px' }}>
                {loadingUsers ? (
                  <p style={{ textAlign: 'center', color: '#64748b', padding: '10px' }}>Laddar användare...</p>
                ) : filteredModalUsers.length > 0 ? (
                  filteredModalUsers.map((u, idx) => {
                    const isChecked = selectedUsernames.includes(u.username);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleUserCheckbox(u.username)}
                        style={{
                          padding: '10px 12px',
                          background: isChecked ? '#eff6ff' : '#f8fafc',
                          border: isChecked ? '2px solid #2563eb' : '1px solid #e2e8f0',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#17243b' }}>{u.username}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                        />
                      </div>
                    );
                  })
                ) : (
                  <p style={{ textAlign: 'center', color: '#64748b', padding: '10px' }}>Inga fler användare att lägga till.</p>
                )}
              </div>

              <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0 }}>
                Valda ({selectedUsernames.length}): <strong>{selectedUsernames.join(', ') || 'Inga valda'}</strong>
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={closeModal} style={cancelButtonStyle}>Avbryt</button>
                <button 
                  type="submit" 
                  disabled={selectedUsernames.length === 0} 
                  style={{ ...submitButtonStyle, opacity: selectedUsernames.length > 0 ? 1 : 0.6, cursor: selectedUsernames.length > 0 ? 'pointer' : 'not-allowed' }}
                >
                  Lägg till valda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TA BORT ANVÄNDARE */}
      {activeModal === 'removeuser' && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: '450px' }}>
            <h3>Ta bort användare från {selectedGroupName}</h3>
            {actionMessage && <p style={{ color: '#b42318', fontSize: '0.9rem', marginTop: '8px' }}>{actionMessage}</p>}
            
            <form onSubmit={handleRemoveUsersFromGroup} style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
              <input
                type="search"
                placeholder="Sök medlemmar att ta bort..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                style={{ ...inputStyle, marginBottom: '4px' }}
              />

              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px', display: 'grid', gap: '6px' }}>
                {filteredGroupMembers.length > 0 ? (
                  filteredGroupMembers.map((username, idx) => {
                    const isChecked = selectedUsernames.includes(username);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleUserCheckbox(username)}
                        style={{
                          padding: '10px 12px',
                          background: isChecked ? '#fef2f2' : '#f8fafc',
                          border: isChecked ? '2px solid #b42318' : '1px solid #e2e8f0',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#17243b' }}>{username}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                        />
                      </div>
                    );
                  })
                ) : (
                  <p style={{ textAlign: 'center', color: '#64748b', padding: '10px' }}>Inga medlemmar att visa.</p>
                )}
              </div>

              <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0 }}>
                Valda att ta bort ({selectedUsernames.length}): <strong>{selectedUsernames.join(', ') || 'Inga valda'}</strong>
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={closeModal} style={cancelButtonStyle}>Avbryt</button>
                <button 
                  type="submit" 
                  disabled={selectedUsernames.length === 0} 
                  style={{ ...submitButtonStyle, background: '#d97706', opacity: selectedUsernames.length > 0 ? 1 : 0.6, cursor: selectedUsernames.length > 0 ? 'pointer' : 'not-allowed' }}
                >
                  Ta bort valda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TA BORT GRUPP */}
      {activeModal === 'deletegroup' && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3>Ta bort grupp</h3>
            <p style={{ marginTop: '10px', color: '#475569' }}>
              Är du säker på att du vill radera gruppen <strong>{selectedGroupName}</strong> permanent?
            </p>
            {actionMessage && <p style={{ color: '#b42318', fontSize: '0.9rem', marginTop: '8px' }}>{actionMessage}</p>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={closeModal} style={cancelButtonStyle}>Avbryt</button>
              <button
                type="button"
                onClick={handleDeleteGroup}
                style={{ ...submitButtonStyle, background: '#b42318' }}
              >
                Ja, ta bort
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stilar
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
  top: 0, left: 0, right: 0, bottom: 0,
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
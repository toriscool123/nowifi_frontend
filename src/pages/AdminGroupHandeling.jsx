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

  // Lägg till valda användare i grupp
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

  // Ta bort valda användare från grupp
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
    .filter((u) => !u.banned_at)
    .filter((u) => !groupMembers.includes(u.username))
    .filter((u) => u.username.toLowerCase().includes(userSearchQuery.trim().toLowerCase()));

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
            <h1>Grupp hantering</h1>
            <p>Klicka på en grupp nedan för att hantera dess medlemmar eller ta bort den.</p>
          </section>

          <button
            type="button"
            onClick={() => { setCreateGroupName(''); setActiveModal('create'); setActionMessage(null); }}
            className="btn btn-primary"
          >
            Skapa grupp
          </button>
        </div>

        {successMessage && (
          <div className="alert alert-success">
            <span>✅</span> {successMessage}
          </div>
        )}

        <section className="wiki-tools">
          <label className="search-field">
            <span className="visually-hidden">Sök grupp</span>
            <input
              type="search"
              placeholder="Sök gruppnamn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
            />
          </label>
        </section>

        {/* ÅTGÄRDSPANEL FÖR VALD GRUPP OCH MEDLEMSLISTA */}
        <section className={`admin-section ${selectedGroup ? 'active-panel' : 'inactive-panel'}`}>
          <div className="panel-header">
            <div>
              <h3>{selectedGroup ? `Vald grupp: ${selectedGroupName}` : 'Ingen grupp vald'}</h3>
              <p className="subtext">
                {selectedGroup ? 'Hantera medlemmar eller ta bort gruppen nedan.' : 'Klicka på ett kort i listan nedan för att välja.'}
              </p>
            </div>

            <div className="action-buttons">
              <button
                type="button"
                disabled={!selectedGroup}
                onClick={openAddUserModal}
                className="btn btn-primary"
              >
                Lägg till användare
              </button>
              <button
                type="button"
                disabled={!selectedGroup || groupMembers.length === 0}
                onClick={openRemoveUserModal}
                className="btn btn-warning"
              >
                Ta bort användare
              </button>
              <button
                type="button"
                disabled={!selectedGroup}
                onClick={() => { setActiveModal('deletegroup'); setActionMessage(null); }}
                className="btn btn-danger"
              >
                Ta bort grupp
              </button>
            </div>
          </div>

          {/* MEDLEMSLISTA FÖR VALD GRUPP */}
          {selectedGroup && (
            <div className="group-members-container">
              <h4>Medlemmar i gruppen ({groupMembers.length})</h4>
              
              {loadingMembers ? (
                <p className="subtext">Laddar medlemmar...</p>
              ) : groupMembers.length > 0 ? (
                <div className="member-list">
                  {groupMembers.map((username, idx) => (
                    <span key={idx} className="member-badge">
                      {username}
                      <button
                        type="button"
                        onClick={() => handleRemoveSingleMember(username)}
                        title={`Ta bort ${username}`}
                        className="remove-badge-btn"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="subtext empty-text">Inga medlemmar i denna grupp ännu.</p>
              )}
            </div>
          )}
        </section>

        {/* GRUPPLISTA */}
        <section className="admin-section">
          <h2>Grupplista ({filteredGroups.length})</h2>

          {loading && <p>Laddar grupper...</p>}
          {error && <p className="error-text">{error}</p>}

          {!loading && !error && (
            <div className="scrollable-list">
              <div className="list-grid">
                {filteredGroups.length > 0 ? (
                  filteredGroups.map((g, index) => {
                    const groupName = typeof g === 'string' ? g : (g.name || g.group || 'Okänd grupp');
                    const isSelected = selectedGroupName === groupName;

                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedGroup(g)}
                        className={`list-item ${isSelected ? 'selected' : ''}`}
                      >
                        <div>
                          <strong>{groupName}</strong>
                        </div>
                        
                        {isSelected && (
                          <span className="selected-indicator">Vald ✓</span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="subtext">Inga grupper matchade din sökning.</p>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* MODAL: SKAPA GRUPP */}
      {activeModal === 'create' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Skapa ny grupp</h3>
            {actionMessage && <p className="error-text">{actionMessage}</p>}
            
            <form onSubmit={handleCreateGroup} className="modal-form">
              <label className="form-label">
                Gruppnamn:
                <input
                  type="text"
                  placeholder="t.ex. ekonomi"
                  value={createGroupName}
                  onChange={(e) => setCreateGroupName(e.target.value)}
                  required
                  className="form-input"
                />
              </label>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn btn-secondary">Avbryt</button>
                <button type="submit" className="btn btn-primary">Skapa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LÄGG TILL ANVÄNDARE */}
      {activeModal === 'adduser' && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <h3>Lägg till användare i {selectedGroupName}</h3>
            {actionMessage && <p className="error-text">{actionMessage}</p>}
            
            <form onSubmit={handleAddUsersToGroup} className="modal-form">
              <input
                type="search"
                placeholder="Sök användare..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="form-input search-input"
              />

              <div className="selection-list">
                {loadingUsers ? (
                  <p className="subtext center-text">Laddar användare...</p>
                ) : filteredModalUsers.length > 0 ? (
                  filteredModalUsers.map((u, idx) => {
                    const isChecked = selectedUsernames.includes(u.username);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleUserCheckbox(u.username)}
                        className={`list-item ${isChecked ? 'selected' : ''}`}
                      >
                        <span className="item-name">{u.username}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="item-checkbox"
                        />
                      </div>
                    );
                  })
                ) : (
                  <p className="subtext center-text">Inga fler användare att lägga till.</p>
                )}
              </div>

              <p className="selection-summary">
                Valda ({selectedUsernames.length}): <strong>{selectedUsernames.join(', ') || 'Inga valda'}</strong>
              </p>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn btn-secondary">Avbryt</button>
                <button 
                  type="submit" 
                  disabled={selectedUsernames.length === 0} 
                  className="btn btn-primary"
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
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <h3>Ta bort användare från {selectedGroupName}</h3>
            {actionMessage && <p className="error-text">{actionMessage}</p>}
            
            <form onSubmit={handleRemoveUsersFromGroup} className="modal-form">
              <input
                type="search"
                placeholder="Sök medlemmar att ta bort..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="form-input search-input"
              />

              <div className="selection-list warning-list">
                {filteredGroupMembers.length > 0 ? (
                  filteredGroupMembers.map((username, idx) => {
                    const isChecked = selectedUsernames.includes(username);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleUserCheckbox(username)}
                        className={`list-item ${isChecked ? 'selected-danger' : ''}`}
                      >
                        <span className="item-name">{username}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="item-checkbox"
                        />
                      </div>
                    );
                  })
                ) : (
                  <p className="subtext center-text">Inga medlemmar att visa.</p>
                )}
              </div>

              <p className="selection-summary">
                Valda att ta bort ({selectedUsernames.length}): <strong>{selectedUsernames.join(', ') || 'Inga valda'}</strong>
              </p>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn btn-secondary">Avbryt</button>
                <button 
                  type="submit" 
                  disabled={selectedUsernames.length === 0} 
                  className="btn btn-warning"
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
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Ta bort grupp</h3>
            <p className="modal-text">
              Är du säker på att du vill radera gruppen <strong>{selectedGroupName}</strong> permanent?
            </p>
            {actionMessage && <p className="error-text">{actionMessage}</p>}

            <div className="modal-actions">
              <button type="button" onClick={closeModal} className="btn btn-secondary">Avbryt</button>
              <button
                type="button"
                onClick={handleDeleteGroup}
                className="btn btn-danger"
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
import { useState, useEffect } from 'react';
import { api } from '../api';
import { createWikiWithOptions } from '../Helpers/wikiHelpers';
import SelectionModal from '../Helpers/SelectionModal'; // <-- Importerar modal-hjälparen

export default function AdminCreateWiki({ me, onBack, onLogout }) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('public');
  const [tags, setTags] = useState('');
  
  const [allUsers, setAllUsers] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [selectedCollaborators, setSelectedCollaborators] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);

  // Modal-states ('users' | 'groups' | null)
  const [activeModal, setActiveModal] = useState(null);

  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchMetaData() {
      try {
        const usersRes = await api('listusers', 'GET');
        if (usersRes.success) setAllUsers(usersRes.users || []);

        const groupsRes = await api('g_list', 'GET');
        if (groupsRes.success) setAllGroups(groupsRes.groups || groupsRes.list || []);
      } catch (err) {
        console.error('Kunde inte hämta metadata:', err);
      }
    }
    fetchMetaData();
  }, []);

  function toggleUser(username) {
    setSelectedCollaborators(prev => 
      prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]
    );
  }

  function toggleGroup(groupName) {
    setSelectedGroups(prev => 
      prev.includes(groupName) ? prev.filter(g => g !== groupName) : [...prev, groupName]
    );
  }

  async function handleCreateWiki(e) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    try {
      setLoading(true);
      const res = await createWikiWithOptions(
        { title, status, tags },
        selectedCollaborators,
        selectedGroups
      );

      setSuccessMessage(`Wikisidan "${title}" har skapats med ID: ${res.wikiId}!`);
      setTitle('');
      setTags('');
      setStatus('public');
      setSelectedCollaborators([]);
      setSelectedGroups([]);
    } catch (err) {
      setError(err.message || 'Ett fel uppstod.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="home">
      <header className="home-header">
        <button className="home-brand brand-button" type="button" onClick={onBack} aria-label="Tillbaka">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>NoWifi</span>
        </button>

        <div className="account-area">
          <button className="text-button" type="button" onClick={onBack}>
            ← Tillbaka till Adminpanelen
          </button>
          <button className="text-button" type="button" onClick={onLogout}>
            Logga ut
          </button>
        </div>
      </header>

      <main className="home-content">
        <section className="wiki-heading" style={{ marginBottom: '20px' }}>
          <p className="eyebrow">ADMINISTRATION</p>
          <h1>Skapa wiki</h1>
          <p style={{ margin: 0 }}>Skapa en ny wiki-sida och välj vilka som ska ha behörighet att redigera.</p>
        </section>

        {successMessage && <div style={{ ...alertStyle, background: '#ecfdf5', borderColor: '#10b981', color: '#065f46' }}>✅ {successMessage}</div>}
        {error && <div style={{ ...alertStyle, background: '#fef2f2', borderColor: '#b42318', color: '#b42318' }}>❌ {error}</div>}

        <section className="admin-section">
          <form onSubmit={handleCreateWiki} style={{ display: 'grid', gap: '16px' }}>
            <label style={labelStyle}>
              Titel:
              <input type="text" placeholder="t.ex. mattens logik" value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} />
            </label>

            <label style={labelStyle}>
              Status:
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </label>

            <label style={labelStyle}>
              Taggar (kommaseparerade):
              <input type="text" placeholder="t.ex. pythagoras, matte" value={tags} onChange={(e) => setTags(e.target.value)} style={inputStyle} />
            </label>

            {/* Knappar för att öppna moduler för att lägga till collaborators */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
              <button 
                type="button" 
                onClick={() => setActiveModal('users')}
                style={actionButtonStyle}
              >
                {selectedCollaborators.length > 0 ? `Valda användare (${selectedCollaborators.length})` : '+ Lägg till användare'}
              </button>
              
              <button 
                type="button" 
                onClick={() => setActiveModal('groups')}
                style={actionButtonStyle}
              >
                {selectedGroups.length > 0 ? `Valda grupper (${selectedGroups.length})` : '+ Lägg till grupper'}
              </button>
            </div>

            {/* Visa valda i en liten sammanställning */}
            {(selectedCollaborators.length > 0 || selectedGroups.length > 0) && (
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                {selectedCollaborators.length > 0 && <p style={{ margin: '0 0 4px 0' }}><strong>Användare:</strong> {selectedCollaborators.join(', ')}</p>}
                {selectedGroups.length > 0 && <p style={{ margin: 0 }}><strong>Grupper:</strong> {selectedGroups.join(', ')}</p>}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={onBack} style={cancelButtonStyle}>Avbryt</button>
              <button type="submit" disabled={loading} style={{ ...submitButtonStyle, opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Skapar...' : 'Skapa wiki'}
              </button>
            </div>
          </form>
        </section>
      </main>

      {/* MODAL FÖR ANVÄNDARE */}
      {activeModal === 'users' && (
        <SelectionModal
          title="Välj användar-collaborators"
          items={allUsers.filter(u => !u.banned_at)}
          selectedItems={selectedCollaborators}
          onToggleItem={toggleUser}
          onConfirm={() => setActiveModal(null)}
          onClose={() => setActiveModal(null)}
          confirmButtonText="Klar"
        />
      )}

      {/* MODAL FÖR GRUPPER */}
      {activeModal === 'groups' && (
        <SelectionModal
          title="Välj grupp-collaborators"
          items={allGroups}
          selectedItems={selectedGroups}
          onToggleItem={toggleGroup}
          onConfirm={() => setActiveModal(null)}
          onClose={() => setActiveModal(null)}
          confirmButtonText="Klar"
        />
      )}
    </div>
  );
}

// Stilar
const labelStyle = { display: 'grid', gap: '6px', fontSize: '0.9rem', fontWeight: 600, color: '#17243b' };
const inputStyle = { padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', width: '100%', background: '#fff' };
const cancelButtonStyle = { padding: '10px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: '#475569' };
const submitButtonStyle = { padding: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 };
const actionButtonStyle = { padding: '8px 14px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: '#17243b', fontSize: '0.9rem' };
const alertStyle = { padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid' };
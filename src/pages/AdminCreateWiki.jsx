import { useState, useEffect } from 'react';
import { api } from '../api';
import { createWikiWithOptions } from '../Helpers/wikiHelpers';
import SelectionModal from '../Helpers/SelectionModal'; 

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

        {successMessage && <div className="alert alert-success">✅ {successMessage}</div>}
        {error && <div className="alert alert-error">❌ {error}</div>}

        <section className="admin-section">
          <form onSubmit={handleCreateWiki} style={{ display: 'grid', gap: '16px' }}>
            <label className="form-label">
              Titel:
              <input type="text" placeholder="t.ex. mattens logik" value={title} onChange={(e) => setTitle(e.target.value)} required className="form-input" />
            </label>

            <label className="form-label">
              Status:
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-input">
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </label>

            <label className="form-label">
              Taggar (kommaseparerade):
              <input type="text" placeholder="t.ex. pythagoras, matte" value={tags} onChange={(e) => setTags(e.target.value)} className="form-input" />
            </label>

            {/* Knappar för att öppna moduler för att lägga till collaborators */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
              <button 
                type="button" 
                onClick={() => setActiveModal('users')}
                className="btn btn-secondary"
              >
                {selectedCollaborators.length > 0 ? `Valda användare (${selectedCollaborators.length})` : '+ Lägg till användare'}
              </button>
              
              <button 
                type="button" 
                onClick={() => setActiveModal('groups')}
                className="btn btn-secondary"
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
              <button type="button" onClick={onBack} className="btn btn-secondary">Avbryt</button>
              <button type="submit" disabled={loading} className="btn btn-primary">
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
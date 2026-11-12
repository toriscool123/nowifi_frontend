import { useState } from 'react';
import { api } from '../api';

export default function AdminCreateWiki({ me, onBack, onLogout }) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('public');
  const [tags, setTags] = useState('');
  
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleCreateWiki(e) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    try {
      setLoading(true);
      // Använder rätt op-namn 'w_wiki_create' från Postman
      const res = await api('w_wiki_create', 'POST', {
        title,
        status,
        tags,
      });

      if (res.success) {
        setSuccessMessage(`Wikisidan "${title}" har skapats! (ID: ${res.wiki_id})`);
        setTitle('');
        setTags('');
        setStatus('public');
      } else {
        setError(res.error || 'Kunde inte skapa wikisidan.');
      }
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
          <p style={{ margin: 0 }}>Fyll i uppgifterna nedan för att skapa en ny wiki-sida.</p>
        </section>

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

        {error && (
          <div style={{ 
            background: '#fef2f2', 
            border: '1px solid #b42318', 
            color: '#b42318', 
            padding: '12px 16px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            fontWeight: 600 
          }}>
            ❌ {error}
          </div>
        )}

        <section className="admin-section">
          <form onSubmit={handleCreateWiki} style={{ display: 'grid', gap: '16px' }}>
            <label style={{ display: 'grid', gap: '6px', fontSize: '0.9rem', fontWeight: 600, color: '#17243b' }}>
              Titel:
              <input
                type="text"
                placeholder="t.ex. mattens logik"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={inputStyle}
              />
            </label>

            <label style={{ display: 'grid', gap: '6px', fontSize: '0.9rem', fontWeight: 600, color: '#17243b' }}>
              Status:
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={inputStyle}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </label>

            <label style={{ display: 'grid', gap: '6px', fontSize: '0.9rem', fontWeight: 600, color: '#17243b' }}>
              Taggar (kommaseparerade):
              <input
                type="text"
                placeholder="t.ex. pythagoras, matte"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                style={inputStyle}
              />
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={onBack} style={cancelButtonStyle}>
                Avbryt
              </button>
              <button 
                type="submit" 
                disabled={loading}
                style={{ ...submitButtonStyle, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Skapar...' : 'Skapa wiki'}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

// Stilar
const inputStyle = {
  padding: '10px 12px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  fontSize: '1rem',
  width: '100%',
  fontFamily: 'inherit',
  background: '#fff'
};

const cancelButtonStyle = {
  padding: '10px 16px',
  background: '#f1f5f9',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 600,
  color: '#475569'
};

const submitButtonStyle = {
  padding: '10px 16px',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 600
};
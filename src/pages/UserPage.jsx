import { useState } from 'react';

// Mock-data för att demonstrera funktionen (du byter ut detta mot API-anrop sen)
const mockWikis = [
  { id: 1, title: 'Projekt Alpha', role: 'Ägare', tags: ['teknik'] },
  { id: 2, title: 'Marknadsföring 2024', role: 'Collaborator', tags: ['internt'] },
  { id: 3, title: 'Teknisk Dokumentation', role: 'Ägare', tags: ['guider'] },
  { id: 4, title: 'HR Riktlinjer', role: 'Collaborator', tags: ['internt'] },
];

const mockPages = [
  { id: 101, wikiId: 1, title: 'Introduktion till Alpha', lastEdited: '2 dagar sedan' },
  { id: 102, wikiId: 1, title: 'API Specifikationer', lastEdited: '1 vecka sedan' },
  { id: 103, wikiId: 2, title: 'Kampanjplan Q4', lastEdited: '4 timmar sedan' },
  { id: 104, wikiId: 2, title: 'Målgruppsanalys', lastEdited: '3 dagar sedan' },
  { id: 105, wikiId: 3, title: 'Systemarkitektur', lastEdited: '2 veckor sedan' },
];

export default function UserPage({ me, onBack, onLogout }) {
  const [search, setSearch] = useState('');
  const [selectedWikiId, setSelectedWikiId] = useState(null);

  // Filtrera wikis baserat på sökning
  const filteredWikis = mockWikis.filter(wiki => 
    wiki.title.toLowerCase().includes(search.toLowerCase())
  );

  // Hämta sidor för den valda wikin
  const pagesForSelectedWiki = mockPages.filter(page => page.wikiId === selectedWikiId);
  const selectedWiki = mockWikis.find(w => w.id === selectedWikiId);

  return (
    <div className="home">
      <header className="home-header">
        <button className="home-brand brand-button" type="button" onClick={onBack} aria-label="Till startsidan">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>NoWifi</span>
        </button>

        <div className="account-area">
          <button className="text-button" type="button" onClick={onBack}>
            Tillbaka till startsidan
          </button>
          <button className="text-button" type="button" onClick={onLogout}>
            Logga ut
          </button>
        </div>
      </header>

      <main className="home-content">
        <section className="wiki-heading">
          <p className="eyebrow">Översikt</p>
          <h1>Min Sida</h1>
          <p>Inloggad som {me?.username}. Här hanterar du dina wikis, sidor och samarbeten.</p>
        </section>

        {/* Sökfunktionen */}
        <section className="wiki-tools" aria-label="Sök ditt innehåll" style={{ marginTop: '24px', marginBottom: '32px' }}>
          <label className="search-field">
            <span className="visually-hidden">Sök i dina wikis</span>
            <input
              type="search"
              placeholder="Sök efter dina wikis och samarbeten..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '1.3rem', letterSpacing: '-0.03em' }}>Mina Wikis & Samarbeten</h2>
            <button className="text-button" type="button" style={{ padding: '0 12px' }}>
              + Skapa ny wiki
            </button>
          </div>
          
          <div style={{ 
            display: 'flex', 
            overflowX: 'auto', 
            gap: '16px', 
            paddingBottom: '16px',
            scrollbarWidth: 'thin'
          }}>
            {filteredWikis.length > 0 ? filteredWikis.map((wiki) => {
              const isSelected = selectedWikiId === wiki.id;
              return (
                <button
                  key={wiki.id}
                  className="wiki-card"
                  onClick={() => setSelectedWikiId(wiki.id)}
                  style={{
                    flex: '0 0 260px', 
                    textAlign: 'left',
                    cursor: 'pointer',
                    padding: '20px',
                    margin: 0,
                    borderColor: isSelected ? '#2457d6' : '#e1e7f0',
                    outline: isSelected ? '3px solid rgb(36 87 214 / 14%)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <p className="eyebrow" style={{ margin: '0 0 8px', color: wiki.role === 'Ägare' ? '#5278d5' : '#18864b' }}>
                    {wiki.role}
                  </p>
                  <h3 style={{ margin: '0 0 12px', fontSize: '1.15rem' }}>{wiki.title}</h3>
                  <div className="wiki-tags">
                    {wiki.tags.map(tag => (
                      <span key={tag} className="wiki-tag">{tag}</span>
                    ))}
                  </div>
                </button>
              );
            }) : (
              <p className="empty-state" style={{ padding: '20px 0' }}>Inga wikis hittades.</p>
            )}
          </div>
        </section>

        <section style={{ 
          padding: '24px', 
          backgroundColor: '#fff', 
          border: '1px solid #e1e7f0', 
          borderRadius: '14px' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '1.3rem', letterSpacing: '-0.03em' }}>
              {selectedWiki ? `Pages i "${selectedWiki.title}"` : 'Hantera Pages'}
            </h2>
            <button 
              className="header-login-button" 
              type="button"
              disabled={!selectedWiki}
              style={{ opacity: selectedWiki ? 1 : 0.5, cursor: selectedWiki ? 'pointer' : 'not-allowed' }}
            >
              + Skapa ny page
            </button>
          </div>

          {!selectedWiki ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              Välj en wiki i listan ovan för att se, redigera eller lägga till sidor.
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              overflowX: 'auto', 
              gap: '16px', 
              paddingBottom: '12px',
              scrollbarWidth: 'thin'
            }}>
              {pagesForSelectedWiki.length > 0 ? pagesForSelectedWiki.map((page) => (
                <div 
                  key={page.id} 
                  className="wiki-card"
                  style={{
                    flex: '0 0 240px',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '140px',
                    padding: '16px'
                  }}
                >
                  <h3 style={{ margin: '0 0 8px', fontSize: '1.05rem', lineHeight: '1.3' }}>{page.title}</h3>
                  <p style={{ margin: 0, color: '#7a879b', fontSize: '0.85rem' }}>Ändrad: {page.lastEdited}</p>
                  
                  <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                    <button className="login-cancel" style={{ marginTop: 0, padding: '6px 12px', fontSize: '0.85rem' }}>Redigera</button>
                    <button className="login-cancel" style={{ marginTop: 0, padding: '6px 12px', fontSize: '0.85rem', color: '#b42318' }}>Ta bort</button>
                  </div>
                </div>
              )) : (
                <p className="empty-state" style={{ padding: '20px 0', width: '100%' }}>Det finns inga pages i denna wiki ännu.</p>
              )}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
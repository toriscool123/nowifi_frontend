import { useState, useEffect } from 'react';
import { api } from '../api';
import CreatePage from './CreatePage';
import EditPage from './EditPage';

export default function UserPage({ me, onBack, onLogout }) {
  const [search, setSearch] = useState('');
  const [selectedWikiId, setSelectedWikiId] = useState(null);
  
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [editingPage, setEditingPage] = useState(null);

  const [wikis, setWikis] = useState([]);
  const [pages, setPages] = useState([]);
  const [loadingWikis, setLoadingWikis] = useState(true);

  useEffect(() => {
    async function fetchUserWikis() {
      try {
        const data = await api('w_wiki_list', 'GET');
        if (data.success && data.wikis) {
          const formattedWikis = data.wikis.map((wiki) => ({
            ...wiki,
            id: wiki.wiki_id,
            role: Number(wiki.user_id) === Number(me?.id || me?.user_id) ? 'Ägare' : 'Collaborator',
            tags: typeof wiki.tags === 'string' && wiki.tags 
              ? wiki.tags.split(',').map((t) => t.trim()) 
              : (wiki.tags || [])
          }));
          setWikis(formattedWikis);
        }
      } catch (err) {
        console.error("Kunde inte hämta wikis:", err);
      } finally {
        setLoadingWikis(false);
      }
    }

    fetchUserWikis();
  }, [me]);

  async function fetchPagesForWiki() {
    if (!selectedWikiId) {
      setPages([]);
      return;
    }

    try {
      const data = await api('w_page_list', 'GET', { wiki_id: selectedWikiId });
      if (data.success && data.pages) {
        const formattedPages = data.pages.map((page) => ({
          ...page,
          id: page.page_id,
          wiki_id: page.wiki_id || selectedWikiId,
          lastEdited: page.updated_at || page.created_at || 'Okänt datum'
        }));
        setPages(formattedPages);
      } else {
        setPages([]);
      }
    } catch (err) {
      console.error("Kunde inte hämta sidor för wikin:", err);
    }
  }

  useEffect(() => {
    fetchPagesForWiki();
  }, [selectedWikiId]);

  async function handleDeletePage(pageId) {
    const confirmDelete = window.confirm("Är du säker på att du vill ta bort denna page?");
    if (!confirmDelete) return;

    try {
      // Använder er api-funktion som nu stöder FormData/objekt korrekt
      const data = await api('w_page_delete', 'POST', { page_id: pageId });

      if (data.success) {
        setPages(prevPages => prevPages.filter(p => p.id !== pageId && p.page_id !== pageId));
      } else {
        alert(data.message || "Kunde inte ta bort sidan.");
      }
    } catch (err) {
      console.error("Fel vid borttagning:", err);
      alert("Ett nätverksfel uppstod vid borttagning.");
    }
  }

  const filteredWikis = wikis.filter(wiki => 
    wiki.title.toLowerCase().includes(search.toLowerCase().trim())
  );

  const selectedWiki = wikis.find(w => String(w.id) === String(selectedWikiId));

  if (loadingWikis) {
    return <p style={{ padding: '2rem', textAlign: 'center' }}>Laddar din sida...</p>;
  }

  if (isCreatingPage) {
    return (
      <CreatePage 
        wikiId={selectedWikiId} 
        wikiTitle={selectedWiki?.title} 
        onBack={() => { setIsCreatingPage(false); fetchPagesForWiki(); }} 
      />
    );
  }

  if (editingPage) {
    return (
      <EditPage 
        page={editingPage}
        wikiTitle={selectedWiki?.title} 
        onBack={() => { setEditingPage(null); fetchPagesForWiki(); }} 
      />
    );
  }

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

        <section className="wiki-tools" style={{ marginTop: '24px', marginBottom: '32px' }}>
          <label className="search-field">
            <input
              type="search"
              placeholder="Sök efter dina wikis och samarbeten..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Mina Wikis & Samarbeten</h2>
          </div>
          
          <div style={{ display: 'flex', overflowX: 'auto', gap: '16px', paddingBottom: '16px' }}>
            {filteredWikis.length > 0 ? filteredWikis.map((wiki) => {
              const isSelected = String(selectedWikiId) === String(wiki.id);
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
                    borderColor: isSelected ? '#2457d6' : '#e1e7f0',
                    outline: isSelected ? '3px solid rgb(36 87 214 / 14%)' : 'none'
                  }}
                >
                  <p className="eyebrow" style={{ margin: '0 0 8px', color: wiki.role === 'Ägare' ? '#5278d5' : '#18864b' }}>
                    {wiki.role || 'Deltagare'}
                  </p>
                  <h3 style={{ margin: '0 0 12px', fontSize: '1.15rem' }}>{wiki.title}</h3>
                  <div className="wiki-tags">
                    {Array.isArray(wiki.tags) && wiki.tags.map(tag => (
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

        <section style={{ padding: '24px', backgroundColor: '#fff', border: '1px solid #e1e7f0', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '1.3rem' }}>
              {selectedWiki ? `Pages i "${selectedWiki.title}"` : 'Hantera Pages'}
            </h2>
            <button 
              className="header-login-button" 
              type="button"
              disabled={!selectedWiki}
              onClick={() => setIsCreatingPage(true)}
              style={{ opacity: selectedWiki ? 1 : 0.5, cursor: selectedWiki ? 'pointer' : 'not-allowed' }}
            >
              + Skapa ny page
            </button>
          </div>

          {!selectedWiki ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              Välj en wiki i listan ovan för att hantera dess pages.
            </div>
          ) : (
            <div style={{ display: 'flex', overflowX: 'auto', gap: '16px', paddingBottom: '12px' }}>
              {/* Filtrera bort eventuella tomma "ghost pages" som saknar titel */}
              {pages.filter(page => page.title && page.title.trim() !== '').length > 0 ? (
                pages.filter(page => page.title && page.title.trim() !== '').map((page) => (
                  <div 
                    key={page.id} 
                    className="wiki-card"
                    style={{ flex: '0 0 240px', display: 'flex', flexDirection: 'column', minHeight: '140px', padding: '16px' }}
                  >
                    <h3 style={{ margin: '0 0 8px', fontSize: '1.05rem' }}>{page.title}</h3>
                    <p style={{ margin: 0, color: '#7a879b', fontSize: '0.85rem' }}>Ändrad: {page.lastEdited}</p>
                    
                    <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                      <button 
                        className="login-cancel" 
                        style={{ marginTop: 0, padding: '6px 12px', fontSize: '0.85rem', cursor: 'pointer' }}
                        onClick={() => setEditingPage(page)}
                      >
                        Redigera
                      </button>
                      <button 
                        className="login-cancel" 
                        style={{ marginTop: 0, padding: '6px 12px', fontSize: '0.85rem', color: '#b42318', cursor: 'pointer' }}
                        onClick={() => handleDeletePage(page.id)}
                      >
                        Ta bort
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state" style={{ padding: '20px 0', width: '100%' }}>Inga pages här ännu.</p>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
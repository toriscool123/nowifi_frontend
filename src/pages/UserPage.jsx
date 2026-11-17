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
    return <p className="loading-text">Laddar din sida...</p>;
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

        <section className="wiki-tools dashboard-tools">
          <label className="search-field">
            <input
              type="search"
              placeholder="Sök efter dina wikis och samarbeten..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
            />
          </label>
        </section>

        {/* Lista med Wikis */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Mina Wikis & Samarbeten</h2>
          </div>
          
          <div className="horizontal-scroll-list">
            {filteredWikis.length > 0 ? filteredWikis.map((wiki) => {
              const isSelected = String(selectedWikiId) === String(wiki.id);
              const roleClass = wiki.role === 'Ägare' ? 'role-owner' : 'role-collaborator';

              return (
                <button
                  key={wiki.id}
                  className={`wiki-card selectable-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedWikiId(wiki.id)}
                >
                  <p className={`eyebrow ${roleClass}`}>
                    {wiki.role || 'Deltagare'}
                  </p>
                  <h3>{wiki.title}</h3>
                  <div className="wiki-tags">
                    {Array.isArray(wiki.tags) && wiki.tags.map(tag => (
                      <span key={tag} className="wiki-tag">{tag}</span>
                    ))}
                  </div>
                </button>
              );
            }) : (
              <p className="empty-state">Inga wikis hittades.</p>
            )}
          </div>
        </section>

        {/* Lista med Pages för vald Wiki */}
        <section className="dashboard-section form-card">
          <div className="section-header">
            <h2>
              {selectedWiki ? `Pages i "${selectedWiki.title}"` : 'Hantera Pages'}
            </h2>
            <button 
              className="btn btn-primary" 
              type="button"
              disabled={!selectedWiki}
              onClick={() => setIsCreatingPage(true)}
            >
              + Skapa ny page
            </button>
          </div>

          {!selectedWiki ? (
            <div className="empty-state padded-empty">
              Välj en wiki i listan ovan för att hantera dess pages.
            </div>
          ) : (
            <div className="horizontal-scroll-list">
              {pages.filter(page => page.title && page.title.trim() !== '').length > 0 ? (
                pages.filter(page => page.title && page.title.trim() !== '').map((page) => (
                  <div key={page.id} className="wiki-card page-card">
                    <h3>{page.title}</h3>
                    <p className="page-meta">Ändrad: {page.lastEdited}</p>
                    
                    <div className="card-actions">
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => setEditingPage(page)}
                      >
                        Redigera
                      </button>
                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={() => handleDeletePage(page.id)}
                      >
                        Ta bort
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state full-width">Inga pages här ännu.</p>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
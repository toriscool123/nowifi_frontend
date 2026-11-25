import { useEffect, useMemo, useRef, useState } from 'react';
import ShowWiki from './ShowWiki';
import ShowWikiPage from './ShowWikiPage';
import Help from './Help';
import { api } from '../api';

export default function Home({
  user,
  isLoggedIn,
  onLoginClick,
  onLogout,
  onAdminClick,
  onSuperAdminClick,
  onUserClick,
  onHelpClick,
}) {
  const [search, setSearch] = useState('');
  const [selectedWikiId, setSelectedWikiId] = useState(null);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);


  // States för wikis och sidor från API:et
  const [wikis, setWikis] = useState([]);
  const [pages, setPages] = useState([]);
  const [loadingWikis, setLoadingWikis] = useState(true);

  // Hämta alla wikis från API vid montering
  useEffect(() => {
    async function fetchWikis() {
      try {
        const data = await api('w_wiki_list', 'GET');
        if (data.success && data.wikis) {
          const formattedWikis = data.wikis.map((wiki) => ({
            ...wiki,
            id: wiki.wiki_id,
            tags: typeof wiki.tags === 'string' && wiki.tags 
              ? wiki.tags.split(',').map((t) => t.trim()) 
              : []
          }));
          setWikis(formattedWikis);
        }
      } catch (err) {
        console.error("Kunde inte hämta wikis:", err);
      } finally {
        setLoadingWikis(false);
      }
    }

    fetchWikis();
  }, []);

  // Hämta sidor för den valda wikin med korrekta parametrar
  useEffect(() => {
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
            tags: typeof page.tags === 'string' && page.tags 
              ? page.tags.split(',').map((t) => t.trim()) 
              : (page.tags || [])
          }));
          setPages(formattedPages);
        } else {
          setPages([]);
        }
      } catch (err) {
        console.error("Kunde inte hämta sidor för wikin:", err);
      }
    }

    fetchPagesForWiki();
  }, [selectedWikiId]);

  // Hämta alla sidor för alla wikis direkt när wikis har laddats
  useEffect(() => {
    async function fetchAllPages() {
      if (wikis.length === 0) return;

      try {
        // Hämta sidor för varje wiki parallellt
        const pagePromises = wikis.map(async (wiki) => {
          const data = await api('w_page_list', 'GET', { wiki_id: wiki.id });
          if (data.success && data.pages) {
            return data.pages.map((page) => ({
              ...page,
              id: page.page_id,
              wiki_id: page.wiki_id || wiki.id,
              tags: typeof page.tags === 'string' && page.tags 
                ? page.tags.split(',').map((t) => t.trim()) 
                : (page.tags || [])
            }));
          }
          return [];
        });

        const results = await Promise.all(pagePromises);
        // Slå ihop alla sidor till en gemensam lista
        setPages(results.flat());
      } catch (err) {
        console.error("Kunde inte hämta sidor:", err);
      }
    }

    fetchAllPages();
  }, [wikis]);

// --- ANVÄNDARE OCH ROLL ---
  const displayName = user?.username || user?.name || 'Användare';
  const initial = displayName ? displayName.charAt(0).toUpperCase() : '?';
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = (user?.username || user?.name)?.trim().toLowerCase() === 'superadmin';

  // --- SÖKNING ---
  const query = search.trim().toLowerCase();
  const isFiltering = Boolean(query);

  // --- DATA SELEKTERING OCH MAPPNING ---
  const publishedPages = pages.filter((page) => page.status === 'published');
  const wikiTitleById = useMemo(() => new Map(wikis.map((wiki) => [String(wiki.id), wiki.title])), [wikis]);

  const selectedPage = publishedPages.find((page) => String(page.id) === String(selectedPageId)) ?? null;
  const selectedWiki = wikis.find((wiki) => String(wiki.id) === String(selectedPage?.wiki_id ?? selectedWikiId)) ?? null;
  
  const pagesInSelectedWiki = selectedWiki
    ? publishedPages.filter((page) => String(page.wiki_id) === String(selectedWiki.id))
    : [];

  // --- FUNKTIONER FÖR ATT ÖPPNA/STÄNGA ---
  function openWiki(id) {
    setSelectedWikiId(id);
    setSelectedPageId(null);
    window.scrollTo({ top: 0 });
  }

  function openPage(page) {
    setSelectedWikiId(page.wiki_id);
    setSelectedPageId(page.id);
    window.scrollTo({ top: 0 });
  }

  function closePage() {
    setSelectedPageId(null);
    window.scrollTo({ top: 0 });
  }

  function closeWiki() {
    setSelectedWikiId(null);
    setSelectedPageId(null);
    window.scrollTo({ top: 0 });
  }

  // --- EFFEKTER OCH MEMOISERING ---
  useEffect(() => {
    if (!menuOpen) return undefined;

    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  // Filtrerade wikis baserat på sökning (titel eller taggar) och behörighet
  const filteredWikis = useMemo(() => {
    return wikis.filter((wiki) => {
      if (!isLoggedIn && wiki.status !== 'public') {
        return false;
      }

      const matchesSearch = wiki.title.toLowerCase().includes(query);
      const matchesTag = wiki.tags.some((tag) => tag.toLowerCase().includes(query));

      return !query || matchesSearch || matchesTag;
    });
  }, [wikis, query, isLoggedIn]);

// Filtrerade sidor baserat på sökning (titel, innehåll eller taggar)
  const filteredPages = useMemo(() => {
    if (!query) return [];

    return publishedPages.filter((page) => {
      const matchesTitle = page.title.toLowerCase().includes(query);
      const matchesContent = page.content.toLowerCase().includes(query);
      const matchesTag = page.tags.some((tag) => tag.toLowerCase().includes(query));
      const matchesCaption = (page.images ?? []).some((image) => 
        image.caption?.toLowerCase().includes(query)
      );

      return matchesTitle || matchesContent || matchesTag || matchesCaption;
    });
  }, [publishedPages, query]);

  // --- RENDER ---
  if (loadingWikis) {
    return <p style={{ padding: '2rem', textAlign: 'center' }}>Laddar wikis...</p>;
  }

  return (
    <div className="home">
      <header className="home-header">
        <a
          className="home-brand"
          href="/"
          aria-label="NoWifi startsida"
          onClick={(event) => {
            event.preventDefault();
            setSelectedWikiId(null);
            setSelectedPageId(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>NoWifi</span>
        </a>

        <div className="account-area">
          <Help onClick={onHelpClick} />

          {isLoggedIn ? (
            <div
              className="profile-menu"
              ref={menuRef}
              onMouseEnter={() => setMenuOpen(true)}
              onMouseLeave={() => setMenuOpen(false)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setMenuOpen(false);
                }
              }}
            >
              <button
                className="profile profile-button"
                type="button"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
              >
                <span className="profile-avatar" aria-hidden="true">{initial}</span>
                <span className="profile-name">{displayName}</span>
                <span className="profile-chevron" aria-hidden="true">▾</span>
              </button>

              {menuOpen && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-inner">
                    <button
                      className="profile-dropdown-item"
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onUserClick();
                      }}
                    >
                      Mina sidor
                    </button>

                    {isAdmin && (
                      <button
                        className="profile-dropdown-item"
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onAdminClick();
                        }}
                      >
                        Adminpanel
                      </button>
                    )}

                    {isSuperAdmin && (
                      <button
                        className="profile-dropdown-item"
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onSuperAdminClick();
                        }}
                      >
                        SuperAdminPanel
                      </button>
                    )}

                  </div>
                </div>
              )}
            </div>
          ) : (
            <button className="header-login-button" type="button" onClick={onLoginClick}>
              Logga in
            </button>
          )}

          {isLoggedIn && (
            <button className="text-button" type="button" onClick={onLogout}>
              Logga ut
            </button>
          )}
        </div>
      </header>

      <main className="home-content">
        {selectedPage ? (
          <ShowWikiPage
            page={selectedPage}
            wikiTitle={selectedWiki?.title}
            onBack={closePage}
          />
        ) : selectedWiki ? (
          <ShowWiki
            wiki={selectedWiki}
            pages={pagesInSelectedWiki}
            onBack={closeWiki}
            onOpenPage={openPage}
          />
        ) : (
          <>
            <section className="wiki-heading">
              <p className="eyebrow">Företagets kunskap</p>
              <h1>Wikis</h1>
              <p>Hitta guider, dokumentation och information samlad på ett ställe.</p>
            </section>

            <section className="wiki-tools" aria-label="Sök och filtrera wikis">
              <label className="search-field">
                <span className="visually-hidden">Sök wikis och wikipages</span>
                <input
                  type="search"
                  placeholder="Sök efter wikis, sidor eller taggar..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
            </section>

            {(!isFiltering || filteredWikis.length > 0) && (
              <section className="wiki-grid" aria-label="Wikilista">
                {filteredWikis.length > 0
                  ? filteredWikis.map((wiki) => (
                      <ShowWiki
                        key={wiki.id}
                        wiki={wiki}
                        preview
                        onOpen={() => openWiki(wiki.id)}
                      />
                    ))
                  : Array.from({ length: 6 }, (_, index) => (
                      <article
                        className="wiki-card wiki-card-placeholder"
                        key={`placeholder-${index}`}
                        aria-label="Wiki-platshållare"
                      >
                        <span className="placeholder-line placeholder-title" />
                        <span className="placeholder-line" />
                        <span className="placeholder-line placeholder-short" />
                      </article>
                    ))}
              </section>
            )}

            {filteredPages.length > 0 && (
              <section className="wikipage-results" aria-labelledby="wikipage-results-title">
                <h2 id="wikipage-results-title">Wikipages</h2>
                <ul className="wikipage-list">
                  {filteredPages.map((page) => (
                    <li key={page.id}>
                      <ShowWikiPage
                        page={page}
                        wikiTitle={wikiTitleById.get(String(page.wiki_id))}
                        preview
                        onOpen={() => openPage(page)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {isFiltering && filteredWikis.length === 0 && filteredPages.length === 0 && (
              <p className="empty-state">Inga wikis eller wikipages matchar din sökning.</p>
            )}
          </>
        )}
      </main>

      <footer className="home-footer">
        <span>© {new Date().getFullYear()} NoWifi. Alla rättigheter förbehållna.</span>
        <a href="mailto:contact@nowifi.example">Kontakta oss</a>
      </footer>
    </div>
  );
}
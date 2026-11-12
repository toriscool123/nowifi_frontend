import { useEffect, useMemo, useRef, useState } from 'react';
import ShowWiki from './ShowWiki';
import ShowWikiPage from './ShowWikiPage';
import { wikis, wikipages } from '../mockWikis';

// Bara publicerade wikipages visas och går att söka på (utkast döljs)
const publishedPages = wikipages.filter((page) => page.status === 'published');
const wikiTitleById = new Map(wikis.map((wiki) => [wiki.id, wiki.title]));

export default function Home({ user, isLoggedIn, onLoginClick, onLogout, onAdminClick }) {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedWikiId, setSelectedWikiId] = useState(null);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const query = search.trim().toLowerCase();
  const isFiltering = Boolean(query || selectedTag);

  // --- HÄR ÄR VIKTIGA KONTROLLER FÖR ANVÄNDARE OCH ROLL ---
  const displayName = user?.username || user?.name || 'Användare';
  const initial = displayName.charAt(0).toUpperCase();
  const isAdmin = user?.role === 'admin';


  // En öppen wikipage hör alltid till en wiki, så wikin följer med
  const selectedPage = publishedPages.find((page) => page.id === selectedPageId) ?? null;
  const selectedWiki =
  wikis.find((wiki) => wiki.id === (selectedPage?.wiki_id ?? selectedWikiId)) ?? null;
  const pagesInSelectedWiki = selectedWiki
  ? publishedPages.filter((page) => page.wiki_id === selectedWiki.id)
  : [];
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
    setSelectedPageId(null); // wikin ligger kvar, så man hamnar tillbaka där
    window.scrollTo({ top: 0 });
  }

  function closeWiki() {
    setSelectedWikiId(null);
    setSelectedPageId(null);
    window.scrollTo({ top: 0 });
  }


  // Stäng adminmenyn vid klick utanför eller Escape
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

  const filteredWikis = useMemo(
    () =>
      wikis.filter((wiki) => {
        const matchesSearch = wiki.title.toLowerCase().includes(query);
        const matchesTag = !selectedTag || wiki.tags.includes(selectedTag);

        return matchesSearch && matchesTag;
      }),
    [query, selectedTag],
  );

  // Wikipages söks på titel, innehåll, bildtexter och taggar.
  // De visas bara som egna sökresultat när man söker eller filtrerar.
  const filteredPages = useMemo(() => {
    if (!query && !selectedTag) return [];

    return publishedPages.filter((page) => {
      const searchableText = [
        page.title,
        page.content,
        page.tags.join(' '),
        ...(page.images ?? []).map((image) => image.caption),
      ]
        .join(' ')
        .toLowerCase();
      const matchesTag = !selectedTag || page.tags.includes(selectedTag);

      return searchableText.includes(query) && matchesTag;
    });
  }, [query, selectedTag]);
  console.log("Inloggad användare:", user);

  return (
    <div className="home">
      <header className="home-header">
        <a
          className="home-brand"
          href="/"
          aria-label="NoWifi startsida"
          onClick={(event) => {
            // Undvik sidomladdning – inloggningen ligger bara i React-state
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
          {isLoggedIn ? (
            <>
              {isAdmin ? (
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
                            onAdminClick();
                          }}
                        >
                          Adminpanel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="profile">
                  <span className="profile-avatar" aria-hidden="true">{initial}</span>
                  <span className="profile-name">{displayName}</span>
                </div>
              )}
              <button className="text-button" type="button" onClick={onLogout}>
                Logga ut
              </button>
            </>
          ) : (
            <button className="header-login-button" type="button" onClick={onLoginClick}>
              Logga in
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
                  placeholder="Sök efter wikis och wikipages..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>

              <label className="tag-filter">
                <span className="visually-hidden">Filtrera efter tagg</span>
                <select
                  value={selectedTag}
                  onChange={(event) => setSelectedTag(event.target.value)}
                >
                  <option value="">Alla taggar</option>
                  <option value="teknik">Teknik</option>
                  <option value="guider">Guider</option>
                  <option value="internt">Internt</option>
                </select>
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
                        aria-label="Wiki-plats­hållare"
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
                        wikiTitle={wikiTitleById.get(page.wiki_id)}
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

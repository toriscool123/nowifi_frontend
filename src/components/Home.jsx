import { useEffect, useMemo, useRef, useState } from 'react';
import ShowWiki from './ShowWiki';
import ShowWikiPage from './ShowWikiPage';
import Help from './Help';
import { api } from '../api';
import Footer from './Footer';

const WIKIS_PER_PAGE = 6;
const WIKI_FETCH_LIMIT = 200;
const SEARCH_DEBOUNCE_MS = 300;

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string' && tags.trim()) {
    return tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

function formatWiki(wiki) {
  return {
    ...wiki,
    id: wiki.wiki_id ?? wiki.id,
    tags: normalizeTags(wiki.tags),
  };
}

function formatPage(page, fallbackWikiId = null) {
  return {
    ...page,
    id: page.page_id ?? page.id,
    wiki_id: page.wiki_id ?? fallbackWikiId,
    tags: normalizeTags(page.tags),
  };
}

// Skapar sidnummer med "…" om det blir många sidor (t.ex. [1, 2, 3, 4] eller [1, '...', 4, 5, 6])
function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push('...');
  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }
  if (end < totalPages - 1) pages.push('...');
  pages.push(totalPages);

  return pages;
}

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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedWikiId, setSelectedWikiId] = useState(null);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);
  const skipNextDebounceRef = useRef(false);

  const [wikis, setWikis] = useState([]);
  const [pages, setPages] = useState([]);
  const [loadingWikis, setLoadingWikis] = useState(true);

  // Rensa cachade sidor vid utloggning
  useEffect(() => {
    if (!isLoggedIn) {
      setPages([]);
    }
  }, [isLoggedIn]);

  // Cooldown / debounce när användaren skriver i sökfältet
  useEffect(() => {
    if (skipNextDebounceRef.current) {
      skipNextDebounceRef.current = false;
      setIsSearching(false);
      return undefined;
    }

    const trimmed = search.trim();
    if (!trimmed) {
      setDebouncedSearch('');
      setIsSearching(false);
      return undefined;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setIsSearching(false);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search]);

  // Hämta wikis vid start eller ändrad inloggningsstatus
  useEffect(() => {
    let active = true;

    async function fetchWikis() {
      setLoadingWikis(true);

      try {
        const data = await api('w_wiki_list', 'GET', {
          limit: WIKI_FETCH_LIMIT,
          offset: 0,
          mine: 0,
        });
        if (!active) return;

        if (data?.success && Array.isArray(data.wikis)) {
          setWikis(data.wikis.map(formatWiki));
        } else {
          setWikis([]);
        }
      } catch (err) {
        if (active) {
          console.error('Kunde inte hämta wikis:', err);
        }
      } finally {
        if (active) {
          setLoadingWikis(false);
        }
      }
    }

    fetchWikis();

    return () => {
      active = false;
    };
  }, [isLoggedIn]);

  // Hämta sidor för vald wiki när man öppnar en wiki
  useEffect(() => {
    let active = true;

    async function fetchPagesForSelectedWiki() {
      if (!selectedWikiId) {
        if (!debouncedSearch.trim()) {
          setPages([]);
        }
        return;
      }

      try {
        const data = await api('w_page_list', 'GET', { wiki_id: selectedWikiId });
        if (!active) return;

        if (data?.success && Array.isArray(data.pages)) {
          setPages(data.pages.map((p) => formatPage(p, selectedWikiId)));
        } else {
          setPages([]);
        }
      } catch (err) {
        if (active) {
          console.error('Kunde inte hämta sidor för wikin:', err);
        }
      }
    }

    fetchPagesForSelectedWiki();

    return () => {
      active = false;
    };
  }, [selectedWikiId, debouncedSearch]);

  // Hämta sidor för de godkända wikisarna när användaren söker
  useEffect(() => {
    let active = true;
    const activeQuery = debouncedSearch.trim().toLowerCase();

    async function fetchPagesForSearch() {
      if (!activeQuery || wikis.length === 0) return;

      try {
        const allowedWikis = wikis.filter((wiki) => isLoggedIn || wiki.status === 'public');
        const pagePromises = allowedWikis.map(async (wiki) => {
          const data = await api('w_page_list', 'GET', { wiki_id: wiki.id });
          if (data?.success && Array.isArray(data.pages)) {
            return data.pages.map((page) => formatPage(page, wiki.id));
          }
          return [];
        });

        const results = await Promise.all(pagePromises);
        if (!active) return;

        const uniqueMap = new Map();
        results.flat().forEach((page) => {
          uniqueMap.set(String(page.id), page);
        });
        setPages(Array.from(uniqueMap.values()));
      } catch (err) {
        if (active) {
          console.error('Kunde inte hämta sidor vid sökning:', err);
        }
      }
    }

    fetchPagesForSearch();

    return () => {
      active = false;
    };
  }, [debouncedSearch, wikis, isLoggedIn]);

  // --- ANVÄNDARE OCH ROLL ---
  const displayName = user?.username || user?.name || 'Användare';
  const initial = displayName ? displayName.charAt(0).toUpperCase() : '?';
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = (user?.username || user?.name)?.trim().toLowerCase() === 'superadmin';

  // --- SÖKNING ---
  const query = search.trim().toLowerCase();
  const isFiltering = Boolean(query);

  // --- BEHÖRIGHET & DATA SELEKTERING ---
  const visibleWikis = useMemo(
    () => wikis.filter((wiki) => isLoggedIn || wiki.status === 'public'),
    [wikis, isLoggedIn]
  );

  const visibleWikiIds = useMemo(
    () => new Set(visibleWikis.map((wiki) => String(wiki.id))),
    [visibleWikis]
  );

  const publishedPages = useMemo(
    () =>
      pages.filter(
        (page) =>
          page.status === 'published' &&
          (isLoggedIn || visibleWikiIds.has(String(page.wiki_id)))
      ),
    [pages, isLoggedIn, visibleWikiIds]
  );

  const wikiTitleById = useMemo(
    () => new Map(visibleWikis.map((wiki) => [String(wiki.id), wiki.title])),
    [visibleWikis]
  );

  const selectedPage =
    publishedPages.find((page) => String(page.id) === String(selectedPageId)) ?? null;
  const selectedWiki =
    visibleWikis.find(
      (wiki) => String(wiki.id) === String(selectedPage?.wiki_id ?? selectedWikiId)
    ) ?? null;

  const pagesInSelectedWiki = selectedWiki
    ? publishedPages.filter((page) => String(page.wiki_id) === String(selectedWiki.id))
    : [];

  // --- FUNKTIONER FÖR ATT ÖPPNA/STÄNGA, PAGINERING OCH TAGGAR ---
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

  function handlePageChange(nextPage) {
    setCurrentPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleTagClick(tag) {
    const cleanTag = String(tag || '').trim();
    if (!cleanTag) return;

    if (cleanTag !== search) {
      skipNextDebounceRef.current = true;
    }
    setSelectedWikiId(null);
    setSelectedPageId(null);
    setCurrentPage(1);
    setSearch(cleanTag);
    setDebouncedSearch(cleanTag);
    setIsSearching(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Stäng profilmeny vid klick utanför eller Escape
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

  // Filtrerade wikis
  const filteredWikis = useMemo(() => {
    if (!query) return visibleWikis;

    return visibleWikis.filter((wiki) => {
      const matchesSearch = (wiki.title || '').toLowerCase().includes(query);
      const matchesTag = wiki.tags.some((tag) => tag.toLowerCase().includes(query));
      return matchesSearch || matchesTag;
    });
  }, [visibleWikis, query]);

  // Sidindelning för wikis
  const totalPages = Math.max(1, Math.ceil(filteredWikis.length / WIKIS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedWikis = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * WIKIS_PER_PAGE;
    return filteredWikis.slice(startIndex, startIndex + WIKIS_PER_PAGE);
  }, [filteredWikis, safeCurrentPage]);

  const pageNumbers = useMemo(
    () => getPageNumbers(safeCurrentPage, totalPages),
    [safeCurrentPage, totalPages]
  );

  // Filtrerade sidor (endast titel och taggar)
  const filteredPages = useMemo(() => {
    if (!query) return [];

    return publishedPages.filter((page) => {
      const matchesTitle = (page.title || '').toLowerCase().includes(query);
      const matchesTag = page.tags.some((tag) => tag.toLowerCase().includes(query));

      return matchesTitle || matchesTag;
    });
  }, [publishedPages, query]);

  // --- RENDER ---
  if (loadingWikis && wikis.length === 0) {
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
            setCurrentPage(1);
            setSearch('');
            setDebouncedSearch('');
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
            onTagClick={handleTagClick}
          />
        ) : selectedWiki ? (
          <ShowWiki
            wiki={selectedWiki}
            pages={pagesInSelectedWiki}
            onBack={closeWiki}
            onOpenPage={openPage}
            onTagClick={handleTagClick}
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
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                />
              </label>
            </section>

            {(!isFiltering || paginatedWikis.length > 0) && (
              <section className="wiki-grid" aria-label="Wikilista">
                {paginatedWikis.length > 0
                  ? paginatedWikis.map((wiki) => (
                      <ShowWiki
                        key={wiki.id}
                        wiki={wiki}
                        preview
                        onOpen={() => openWiki(wiki.id)}
                        onTagClick={handleTagClick}
                      />
                    ))
                  : Array.from({ length: 3 }, (_, index) => (
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

            {totalPages > 1 && (
              <nav className="wiki-pagination" aria-label="Sidnumrering för wikis">
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  disabled={safeCurrentPage === 1}
                  aria-label="Föregående sida"
                >
                  ←
                </button>

                {pageNumbers.map((item, idx) =>
                  item === '...' ? (
                    <span key={`ellipsis-${idx}`} className="pagination-ellipsis" aria-hidden="true">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      className={`pagination-btn ${safeCurrentPage === item ? 'active' : ''}`}
                      onClick={() => handlePageChange(item)}
                      aria-current={safeCurrentPage === item ? 'page' : undefined}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  disabled={safeCurrentPage === totalPages}
                  aria-label="Nästa sida"
                >
                  →
                </button>
              </nav>
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
                        onTagClick={handleTagClick}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {isFiltering && filteredWikis.length === 0 && filteredPages.length === 0 && !isSearching && (
              <p className="empty-state">Inga wikis eller wikipages matchar din sökning.</p>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
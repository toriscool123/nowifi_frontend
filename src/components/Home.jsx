import { useEffect, useMemo, useRef, useState } from 'react';
import ShowWiki from './ShowWiki';

// Hårdkodade wikis för testning – byts mot data från API:t senare.
// En wiki har bara title och tags. Innehållet ligger i wikipages (kommer senare).
// tags måste matcha värdena i taggfiltret (teknik, guider, internt).
const wikis = [
  { id: 'onboarding', title: 'Onboarding', tags: ['guider', 'internt'] },
  { id: 'natverk-vpn', title: 'Nätverk och VPN', tags: ['teknik', 'guider'] },
  { id: 'losenord-inloggning', title: 'Lösenord och inloggning', tags: ['teknik', 'internt'] },
  { id: 'support', title: 'Support och felanmälan', tags: ['guider'] },
  { id: 'it-sakerhet', title: 'IT-säkerhet', tags: ['teknik', 'internt'] },
  { id: 'utrustning', title: 'Utrustning och beställningar', tags: ['guider', 'internt'] },
];

export default function Home({ user, isLoggedIn, onLoginClick, onLogout, onAdminClick }) {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedWikiId, setSelectedWikiId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const selectedWiki = wikis.find((wiki) => wiki.id === selectedWikiId) ?? null;

  function openWiki(id) {
    setSelectedWikiId(id);
    window.scrollTo({ top: 0 });
  }

  function closeWiki() {
    setSelectedWikiId(null);
    window.scrollTo({ top: 0 });
  }

  const isAdmin = user?.role === 'admin';
  const displayName = user?.username ?? '';
  const initial = displayName.charAt(0).toUpperCase() || '?';

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

  const filteredWikis = useMemo(() => {
    const query = search.trim().toLowerCase();

    return wikis.filter((wiki) => {
      // Just nu söks det bara på wikins titel.
      // TODO: wikipages som hör till en wiki ska också gå att söka på härifrån.
      // När de finns kan söksträngen byggas ut, t.ex.:
      //   [wiki.title, ...(wiki.pages ?? []).map((page) => page.title)].join(' ')
      // (eller visa träffar på wikipages som egna resultat under wikin).
      const matchesSearch = wiki.title.toLowerCase().includes(query);
      const matchesTag = !selectedTag || wiki.tags.includes(selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [search, selectedTag]);

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
        {selectedWiki ? (
          <ShowWiki wiki={selectedWiki} onBack={closeWiki} />
        ) : (
          <>
            <section className="wiki-heading">
              <p className="eyebrow">Företagets kunskap</p>
              <h1>Wikis</h1>
              <p>Hitta guider, dokumentation och information samlad på ett ställe.</p>
            </section>

            <section className="wiki-tools" aria-label="Sök och filtrera wikis">
              <label className="search-field">
                <span className="visually-hidden">Sök wikis</span>
                <input
                  type="search"
                  placeholder="Sök efter en wiki..."
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

            <section className="wiki-grid" aria-label="Wikilista">
              {filteredWikis.length > 0 ? (
                filteredWikis.map((wiki) => (
                  <ShowWiki
                    key={wiki.id}
                    wiki={wiki}
                    preview
                    onOpen={() => openWiki(wiki.id)}
                  />
                ))
              ) : search || selectedTag ? (
                <p className="empty-state">Inga wikis matchar din sökning.</p>
              ) : (
                Array.from({ length: 6 }, (_, index) => (
                  <article
                    className="wiki-card wiki-card-placeholder"
                    key={`placeholder-${index}`}
                    aria-label="Wiki-plats­hållare"
                  >
                    <span className="placeholder-line placeholder-title" />
                    <span className="placeholder-line" />
                    <span className="placeholder-line placeholder-short" />
                  </article>
                ))
              )}
            </section>
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
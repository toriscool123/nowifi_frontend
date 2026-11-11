import { useMemo, useState } from 'react';

const wikis = [];

export default function Home({ isLoggedIn, onLoginClick, onLogout }) {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const filteredWikis = useMemo(() => {
    const query = search.trim().toLowerCase();

    return wikis.filter((wiki) => {
      const matchesSearch = `${wiki.title} ${wiki.description}`
        .toLowerCase()
        .includes(query);
      const matchesTag = !selectedTag || wiki.tags.includes(selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [search, selectedTag]);

  return (
    <div className="home">
      <header className="home-header">
        <a className="home-brand" href="/" aria-label="NoWifi startsida">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>NoWifi</span>
        </a>

        <div className="account-area">
          {isLoggedIn ? (
            <>
              <div className="profile">
                <span className="profile-avatar" aria-hidden="true">D</span>
                <span className="profile-name">Demoprofil</span>
              </div>
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
              <article className="wiki-card" key={wiki.id}>
                <h2>{wiki.title}</h2>
                <p>{wiki.description}</p>
              </article>
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
      </main>

      <footer className="home-footer">
        <span>© {new Date().getFullYear()} NoWifi. Alla rättigheter förbehållna.</span>
        <a href="mailto:contact@nowifi.example">Kontakta oss</a>
      </footer>
    </div>
  );
}
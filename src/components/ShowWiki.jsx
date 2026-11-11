function formatTag(tag) {
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

function TagList({ tags }) {
  if (!tags?.length) return null;

  return (
    <ul className="wiki-tags" aria-label="Taggar">
      {tags.map((tag) => (
        <li className="wiki-tag" key={tag}>{formatTag(tag)}</li>
      ))}
    </ul>
  );
}

/**
 * En wiki har bara title och tags. Själva innehållet ligger i wikipages
 * som hör till wikin (kommer senare).
 *
 * Visas på två sätt:
 *  - preview: ett kort för wiki-griden på Home (klickbart, anropar onOpen)
 *  - annars:  wikins egen sida (anropar onBack för att komma tillbaka till listan)
 */
export function ShowWiki({ wiki, preview = false, onOpen, onBack }) {
  if (!wiki) {
    return <p>Ingen wiki vald.</p>;
  }

  if (preview) {
    return (
      <article className="wiki-card wiki-preview">
        <h2>
          <button className="wiki-preview-title" type="button" onClick={onOpen}>
            {wiki.title}
          </button>
        </h2>
        <TagList tags={wiki.tags} />
      </article>
    );
  }

  return (
    <article className="wiki-page">
      <button className="text-button wiki-back" type="button" onClick={onBack}>
        Tillbaka till alla wikis
      </button>

      <header className="wiki-page-header">
        <TagList tags={wiki.tags} />
        <h1>{wiki.title}</h1>
      </header>

      {/*
        Wikipages: här ska wikins wikipages listas (och öppnas).
        Tänk på att Home ska kunna söka på wikipages också – se kommentaren
        vid filteredWikis i Home.jsx så att datan hålls i samma form på båda ställena.
      */}
      <section className="wiki-pages" aria-labelledby="wiki-pages-title">
        <h2 id="wiki-pages-title">Wikipages</h2>
        <p className="wiki-pages-empty">Den här wikin har inga wikipages än.</p>
      </section>
    </article>
  );
}

export default ShowWiki;
import ShowWikiPage from './ShowWikiPage';
import TagList from './TagList';

/**
 * En wiki har bara title och tags. Innehållet ligger i wikipages som hör till wikin.
 *
 * Visas på två sätt:
 *  - preview: ett kort för wiki-griden på Home (klickbart, anropar onOpen)
 *  - annars:  wikins egen sida med dess wikipages (pages), onBack går tillbaka
 *             till listan och onOpenPage öppnar en wikipage
 */
export function ShowWiki({ wiki, pages = [], preview = false, onOpen, onBack, onOpenPage }) {
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

      <section className="wiki-pages" aria-labelledby="wiki-pages-title">
        <h2 id="wiki-pages-title">Wikipages</h2>

        {pages.length > 0 ? (
          <ul className="wikipage-list">
            {pages.map((page) => (
              <li key={page.id}>
                <ShowWikiPage page={page} preview onOpen={() => onOpenPage(page)} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="wiki-pages-empty">Den här wikin har inga wikipages än.</p>
        )}
      </section>
    </article>
  );
}

export default ShowWiki;
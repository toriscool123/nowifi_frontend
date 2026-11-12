import TagList from './TagList';

/**
 * Visar en wikipage på två sätt:
 *  - preview: ett kort i en lista (under en wiki eller bland sökresultaten på Home).
 *             wikiTitle visas som liten etikett när sidan listas utanför sin wiki.
 *  - annars:  hela sidan med innehåll och bilder (onBack går tillbaka till wikin)
 */
export function ShowWikiPage({ page, wikiTitle, preview = false, onOpen, onBack }) {
  if (!page) {
    return <p>Ingen wikipage vald.</p>;
  }

  if (preview) {
    return (
      <article className="wiki-card wiki-preview wikipage-preview">
        {wikiTitle && <p className="wikipage-parent">{wikiTitle}</p>}
        <h3>
          <button className="wiki-preview-title" type="button" onClick={onOpen}>
            {page.title}
          </button>
        </h3>
        <p className="wikipage-excerpt">{page.content}</p>
        <TagList tags={page.tags} />
      </article>
    );
  }

  // Innehållet visas som ren text (ett stycke per tomrad)
  const paragraphs = page.content.split(/\n{2,}/);

  return (
    <article className="wiki-page">
      <button className="text-button wiki-back" type="button" onClick={onBack}>
        Tillbaka till {wikiTitle ?? 'wikin'}
      </button>

      <header className="wiki-page-header">
        <TagList tags={page.tags} />
        <h1>{page.title}</h1>
      </header>

      <div className="wikipage-body">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}

        {page.images?.length > 0 && (
          <div className="wikipage-images">
            {page.images.map((image) => (
              <figure key={image.src}>
                <img src={image.src} alt={image.caption || ''} />
                {image.caption && <figcaption>{image.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export default ShowWikiPage;
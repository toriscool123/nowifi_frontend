import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import TagList from './TagList';

function getPlainExcerpt(raw = '', maxLength = 160) {
  if (!raw) return '';

  const cleaned = raw
    // Ta bort bild-markdown ![alt](url)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    // Ta bort HTML-taggar som <span style="..."> och </span>
    .replace(/<[^>]*>/g, '')
    // Ta bort rubriktecken (#), listmarkeringar och fet/kursiv-tecken
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/(\*\*|__|\*|_)/g, '')
    // Slå ihop radbrytningar och extra mellanslag till ett enda mellanslag
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength).trim()}…`;
}

export function ShowWikiPage({ page, wikiTitle, preview = false, onOpen, onBack }) {
  if (!page) {
    return <p>Ingen wikipage vald.</p>;
  }

  // Hjälpfunktion för att bygga relativ sökväg som går via proxyn
  function getAbsoluteImageUrl(path) {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
      return path;
    }
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // Peka direkt på din fungerande bs-server där uploads-mappen ligger
    const serverBase = 'https://bs1.ntigskovde.se';

    if (cleanPath.startsWith('uploads/')) {
      return `${serverBase}/${cleanPath}`;
    }
    return `${serverBase}/uploads/${cleanPath}`;
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
        <p className="wikipage-excerpt">{getPlainExcerpt(page.content)}</p>
        <TagList tags={page.tags} />
      </article>
    );
  }

  return (
    <article className="wiki-page">
      <button className="text-button wiki-back" type="button" onClick={onBack}>
        Tillbaka till {wikiTitle ?? 'wikin'}
      </button>

      <header className="wiki-page-header">
        <TagList tags={page.tags} />
        <h1>{page.title}</h1>
      </header>

      <div className="wikipage-body" style={{ lineHeight: '1.6' }}>
        {(() => {
          let imageCounter = 0;
          return (
            <ReactMarkdown
              rehypePlugins={[rehypeRaw]}
              urlTransform={(value) => value}
              components={{
                img: ({ src, alt }) => {
                  if (!src) return null;

                  let align = 'center';
                  let width = '100%';

                  if (src.includes('?')) {
                    const parts = src.split('?');
                    const params = new URLSearchParams(parts[1]);
                    if (params.get('align')) align = params.get('align');
                    if (params.get('width')) width = params.get('width') + '%';
                    src = parts[0];
                  }

                  // Hämta rätt bild i rätt ordning baserat på en löpande räknare
                  const currentIndex = imageCounter++;
                  let imageUrl = src;

                  if (page?.images && page.images[currentIndex] && page.images[currentIndex].file_path) {
                    imageUrl = page.images[currentIndex].file_path;
                  } else {
                    const filename = src.split('/').pop();
                    imageUrl = `uploads/${filename}`;
                  }

                  const finalImageUrl = getAbsoluteImageUrl(imageUrl);

                  const containerStyle = {
                    display: 'block',
                    textAlign: align,
                    margin: '1.5rem 0',
                  };

                  return (
                    <span key={currentIndex} style={containerStyle}>
                      <img
                        src={finalImageUrl}
                        alt={alt || 'Bild'}
                        style={{ width: width, maxWidth: '100%', borderRadius: '8px', display: 'inline-block' }}
                      />
                      {alt && (
                        <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginTop: '6px' }}>
                          {alt}
                        </span>
                      )}
                    </span>
                  );
                },
              }}
            >
              {page.content}
            </ReactMarkdown>
          );
        })()}

        {/* Fallback om bilder finns i page.images men saknas i texten */}
        {page.images?.length > 0 && !page.content.includes('uploads/') && (
          <div className="wikipage-images" style={{ marginTop: '20px' }}>
            {page.images.map((image, idx) => {
              const imgPath = getAbsoluteImageUrl(image.file_path);
              return (
                <figure key={image.image_id || idx} style={{ margin: '1.5rem 0', textAlign: 'center' }}>
                  <img src={imgPath} alt={image.caption || ''} style={{ maxWidth: '100%', borderRadius: '8px' }} />
                  {image.caption && (
                    <figcaption style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px' }}>
                      {image.caption}
                    </figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}

export default ShowWikiPage;
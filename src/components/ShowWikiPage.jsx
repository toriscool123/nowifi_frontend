import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import TagList from './Taglist';

function getDisplayCaption(alt) {
  if (!alt) return '';
  const trimmed = alt.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return '';
  if (/\.(jpe?g|png|gif|webp|avif|svg)$/i.test(trimmed)) return '';
  return trimmed;
}

function getPlainExcerpt(raw = '', maxLength = 160) {
  if (!raw) return '';

  const cleaned = raw
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/(\*\*|__|\*|_)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength).trim()}…`;
}

export function ShowWikiPage({ page, wikiTitle, preview = false, showBackButton = true, onOpen, onBack, onTagClick }) {
  if (!page) {
    return <p>Ingen wikipage vald.</p>;
  }

  function getAbsoluteImageUrl(path) {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
      return path;
    }
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
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
        <TagList tags={page.tags} onTagClick={onTagClick} />
      </article>
    );
  }

  return (
    <article
      className="wiki-page"
      style={{
        width: '100%',
        maxWidth: '100%',
      }}
    >
      {showBackButton && (
        <button className="text-button wiki-back" type="button" onClick={onBack}>
          Tillbaka till {wikiTitle ?? 'wikin'}
        </button>
      )}

      <header className="wiki-page-header">
        <TagList tags={page.tags} onTagClick={onTagClick} />
        <h1>{page.title}</h1>
      </header>

      <div
        className="wikipage-body"
        style={{
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          lineHeight: '1.6',
          overflowX: 'clip',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
        }}
      >
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
                  let cleanSrc = src;

                  if (cleanSrc.includes('?')) {
                    const parts = cleanSrc.split('?');
                    const params = new URLSearchParams(parts[1]);
                    if (params.get('align')) align = params.get('align');
                    if (params.get('width')) width = `${params.get('width')}%`;
                    cleanSrc = parts[0];
                  }

                  const currentIndex = imageCounter++;
                  let imageUrl = cleanSrc;

                  if (cleanSrc.startsWith('blob:')) {
                    imageUrl = cleanSrc;
                  } else if (page?.images && page.images[currentIndex] && page.images[currentIndex].file_path) {
                    imageUrl = page.images[currentIndex].file_path;
                  } else {
                    const filename = cleanSrc.split('/').pop();
                    imageUrl = `uploads/${filename}`;
                  }

                  const finalImageUrl = getAbsoluteImageUrl(imageUrl);
                  const captionText = getDisplayCaption(alt);

                  const containerStyle = {
                    display: 'block',
                    textAlign: align,
                    margin: '1.5rem 0',
                  };

                  return (
                    <span key={currentIndex} style={containerStyle}>
                      <img
                        src={finalImageUrl}
                        alt={captionText || 'Bild'}
                        style={{
                          width: width,
                          maxWidth: '100%',
                          borderRadius: '8px',
                          display: 'inline-block',
                        }}
                      />
                      {captionText && (
                        <span
                          style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            color: '#64748b',
                            marginTop: '6px',
                          }}
                        >
                          {captionText}
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

        {page.images?.length > 0 && !page.content.includes('uploads/') && !page.content.includes('blob:') && (
          <div className="wikipage-images" style={{ marginTop: '20px' }}>
            {page.images.map((image, idx) => {
              const imgPath = getAbsoluteImageUrl(image.file_path);
              const captionText = getDisplayCaption(image.caption);
              return (
                <figure key={image.image_id || idx} style={{ margin: '1.5rem 0', textAlign: 'center' }}>
                  <img src={imgPath} alt={captionText || ''} style={{ maxWidth: '100%', borderRadius: '8px' }} />
                  {captionText && (
                    <figcaption style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px' }}>
                      {captionText}
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
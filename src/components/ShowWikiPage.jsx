import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import TagList from './TagList';

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

function parseImageLayout(src, styleProp, widthProp) {
  let align = 'center';
  let width = '100%';
  let cleanSrc = src || '';

  // 1. Läs ?align=...&width=... från URL om det finns
  if (cleanSrc.includes('?')) {
    const parts = cleanSrc.split('?');
    const params = new URLSearchParams(parts[1]);
    if (params.get('align')) align = params.get('align');
    if (params.get('width')) {
      const w = String(params.get('width')).replace(/[^0-9]/g, '');
      if (w) width = `${w}%`;
    }
    cleanSrc = parts[0];
  }

  // 2. Läs width-attributet om det finns (t.ex. width="50%")
  if (widthProp) {
    const wStr = String(widthProp).trim();
    if (wStr.endsWith('%') || wStr.endsWith('px')) {
      width = wStr;
    } else {
      const wNum = wStr.replace(/[^0-9]/g, '');
      if (wNum) width = `${wNum}%`;
    }
  }

  // 3. Läs style-sträng eller style-objekt från TipTap (t.ex. "width: 50%; margin-left: 0; margin-right: auto;")
  if (typeof styleProp === 'string') {
    const widthMatch = styleProp.match(/width\s*:\s*([0-9]+(?:\.[0-9]+)?%|[0-9]+px)/i);
    if (widthMatch) {
      width = widthMatch[1];
    }
    if (/margin-left\s*:\s*0/i.test(styleProp) && /margin-right\s*:\s*auto/i.test(styleProp)) {
      align = 'left';
    } else if (/margin-right\s*:\s*0/i.test(styleProp) && /margin-left\s*:\s*auto/i.test(styleProp)) {
      align = 'right';
    } else if (/text-align\s*:\s*(left|center|right)/i.test(styleProp)) {
      const alignMatch = styleProp.match(/text-align\s*:\s*(left|center|right)/i);
      if (alignMatch) align = alignMatch[1].toLowerCase();
    }
  } else if (styleProp && typeof styleProp === 'object') {
    if (styleProp.width) width = String(styleProp.width);
    if (styleProp.marginLeft === '0' || styleProp.marginLeft === 0) align = 'left';
    else if (styleProp.marginRight === '0' || styleProp.marginRight === 0) align = 'right';
    else if (styleProp.textAlign) align = styleProp.textAlign;
  }

  return { cleanSrc, align, width };
}

export function ShowWikiPage({
  page,
  wikiTitle,
  preview = false,
  showBackButton = true,
  onOpen,
  onBack,
  onTagClick,
}) {
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
                img: ({ src, alt, style, width: widthAttr }) => {
                  if (!src) return null;

                  const { cleanSrc, align, width } = parseImageLayout(src, style, widthAttr);

                  const currentIndex = imageCounter++;
                  const dbImagePath = page?.images?.[currentIndex]?.file_path;
                  let imageUrl = cleanSrc;

                  // Om en sparad bild finns i databasen (och vi inte är i live-preview), ersätt alltid gamla blob:-länkar med DB-sökvägen
                  if (dbImagePath && (showBackButton || !cleanSrc.startsWith('blob:'))) {
                    imageUrl = dbImagePath;
                  } else if (cleanSrc.startsWith('blob:')) {
                    imageUrl = cleanSrc;
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
                          height: 'auto',
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
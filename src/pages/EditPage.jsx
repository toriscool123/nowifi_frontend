import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { api } from '../api';
import ImageUploader from '../components/ImageUploader';
import MarkdownToolbar from '../Helpers/markdownToolbar';

export default function EditPage({ page, wikiTitle, onBack }) {
  const [title, setTitle] = useState(page?.title || '');
  const [tags, setTags] = useState(page?.tags || 'test');

  const [imageItems, setImageItems] = useState([]);
  const [saving, setSaving] = useState(false);

  const textareaRef = useRef(null);

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

  // Ersätt döda blob:http://localhost:... länkar med faktiska URL:er från databasen (page.images)
  function resolveDbImagesInMarkdown(rawContent, imagesFromDb) {
    if (!rawContent) return '';

    let imgIndex = 0;

    // Städa först radbrytningar inuti ![alt](url)
    const cleaned = rawContent.replace(
      /!\[([^\]]*)\]\(([\s\S]*?)\)/g,
      (_, altText, urlPart) => `![${altText}](${urlPart.replace(/\s+/g, '')})`
    );

    return cleaned.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      (fullMatch, altText, fullUrl) => {
        const currentIdx = imgIndex++;
        const [baseUrl, queryString] = fullUrl.split('?');
        const querySuffix = queryString ? `?${queryString}` : '';

        // Om det är en gammal blob-länk, hämta den riktiga bildsökvägen från databasen (page.images)
        if (baseUrl.startsWith('blob:')) {
          const dbImage = imagesFromDb?.[currentIdx];
          if (dbImage?.file_path) {
            return `![${altText}](${getAbsoluteImageUrl(dbImage.file_path)}${querySuffix})`;
          }
          if (altText && /\.(jpe?g|png|gif|webp)$/i.test(altText.trim())) {
            return `![${altText}](${getAbsoluteImageUrl(`uploads/${altText.trim()}`)}${querySuffix})`;
          }
        }

        // Om det redan är en relativ uploads-väg utan domän, gör den absolut mot servern
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
          return `![${altText}](${getAbsoluteImageUrl(baseUrl)}${querySuffix})`;
        }

        return fullMatch;
      }
    );
  }

  const [content, setContent] = useState(() =>
    resolveDbImagesInMarkdown(page?.content || '', page?.images || [])
  );

  // Uppdatera innehållet om `page` ändras
  useEffect(() => {
    setTitle(page?.title || '');
    setTags(page?.tags || 'test');
    setContent(resolveDbImagesInMarkdown(page?.content || '', page?.images || []));
    setImageItems([]);
  }, [page]);

  const hasUnsavedChanges =
    title !== (page?.title || '') ||
    content !== resolveDbImagesInMarkdown(page?.content || '', page?.images || []);

  useEffect(() => {
    function handleBeforeUnload(e) {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  function handleBackClick() {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm('Du har osparade ändringar. Vill du lämna utan att spara?');
      if (!confirmLeave) return;
    }
    onBack();
  }

  function handleImageAdded(newItem) {
    setImageItems(prev => [...prev, { file: newItem.file, caption: newItem.caption }]);
    setContent(prev => prev + '\n' + newItem.markdownSnippet + '\n');
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!title.trim()) return alert('Du måste ange en titel!');

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('page_id', page.id || page.page_id);
      formData.append('title', title.trim());
      formData.append('content', content);
      formData.append('status', 'published');
      formData.append('tags', tags);

      imageItems.forEach((item) => {
        formData.append('images[]', item.file);
        formData.append('captions[]', item.caption);
      });

      const data = await api('w_page_update', 'POST', formData);

      if (data.success) {
        onBack();
      } else {
        alert(data.message || 'Kunde inte uppdatera sidan.');
      }
    } catch (err) {
      console.error('Fel vid uppdatering:', err);
      alert('Ett nätverksfel uppstod.');
    } finally {
      setSaving(false);
    }
  }

  let imageCounter = 0;
  let newImageCounter = 0;

  return (
    <div className="home">
      <header className="home-header">
        <button className="text-button" type="button" onClick={handleBackClick}>
          ← Tillbaka till Min Sida
        </button>
      </header>

      <main className="home-content">
        <section className="wiki-heading">
          <p className="eyebrow">{wikiTitle}</p>
          <h1>Redigera page</h1>
        </section>

        <form onSubmit={handleSave} className="form-card">
          <div className="form-group">
            <label className="form-label">Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Taggar</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="form-input"
            />
          </div>

          <ImageUploader onImageAdded={handleImageAdded} />

          <div className="editor-split">
            {/* Vänster: Textarea */}
            <div className="editor-pane">
              <label className="form-label text-muted">Markdown-kod</label>

              <MarkdownToolbar
                textareaRef={textareaRef}
                content={content}
                setContent={setContent}
              />

              <textarea
                ref={textareaRef}
                rows={14}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="form-input markdown-textarea"
              />
            </div>

            {/* Höger: Direkt Förhandsgranskning */}
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.9rem', color: '#475569' }}>
                Direkt förhandsgranskning (Page-vy)
              </label>
              <div
                style={{
                  minHeight: '307px',
                  maxHeight: '350px',
                  overflowY: 'auto',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  lineHeight: '1.6',
                  boxSizing: 'border-box',
                }}
              >
                {content ? (
                  <div className="markdown-preview">
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
                            if (params.get('width')) width = params.get('width') + '%';
                            cleanSrc = parts[0];
                          }

                          const currentIndex = imageCounter++;
                          let finalImageUrl = '';

                          if (cleanSrc.startsWith('blob:') && imageItems[newImageCounter]?.file) {
                            finalImageUrl = URL.createObjectURL(imageItems[newImageCounter].file);
                            newImageCounter++;
                          } else {
                            let imageUrl = cleanSrc;
                            if (page?.images?.[currentIndex]?.file_path) {
                              imageUrl = page.images[currentIndex].file_path;
                            }
                            finalImageUrl = getAbsoluteImageUrl(imageUrl);
                          }

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
                                style={{
                                  width: width,
                                  maxWidth: '100%',
                                  borderRadius: '8px',
                                  display: 'inline-block',
                                }}
                              />
                              {alt && (
                                <span
                                  style={{
                                    display: 'block',
                                    fontSize: '0.85rem',
                                    color: '#64748b',
                                    marginTop: '6px',
                                  }}
                                >
                                  {alt}
                                </span>
                              )}
                            </span>
                          );
                        },
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="empty-preview">Förhandsgranskning visas här när du skriver...</p>
                )}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleBackClick}>
              Avbryt
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Sparar...' : 'Spara ändringar'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
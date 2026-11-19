import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { api } from '../api';
import ImageUploader from '../components/ImageUploader';
import MarkdownToolbar from '../Helpers/markdownToolbar';

export default function CreatePage({ wikiId, wikiTitle, onBack }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('test');
  const [status, setStatus] = useState('published');

  const [imageItems, setImageItems] = useState([]);
  const [saving, setSaving] = useState(false);

  const textareaRef = useRef(null);

  const hasUnsavedChanges = title.trim().length > 0 || content.trim().length > 0;

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
    if (!wikiId) return alert('Ingen wiki är vald!');

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('wiki_id', wikiId);
      formData.append('title', title.trim());
      formData.append('content', content);
      formData.append('status', status);
      formData.append('tags', tags);

      imageItems.forEach((item) => {
        formData.append('images[]', item.file);
        formData.append('captions[]', item.caption);
      });

      const data = await api('w_page_create', 'POST', formData);

      if (data.success) {
        onBack();
      } else {
        alert(data.message || 'Kunde inte spara sidan.');
      }
    } catch (err) {
      console.error('Fel vid sparande:', err);
      alert('Ett nätverksfel uppstod.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="home">
      <header className="home-header">
        <button className="text-button" type="button" onClick={handleBackClick}>
          ← Tillbaka till Min Sida
        </button>
      </header>

      <main className="home-content">
        <form onSubmit={handleSave} className="create-form">
          <div className="form-group">
            <h1>Skapa ny page</h1>
            <label className="form-label">Titel</label>
            <input
              type="text"
              placeholder="Sidans titel..."
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

          <div className="editor-container">
            {/* Vänster: Textarea */}
            <div className="editor-column">
              <label className="editor-label">
                Markdown-kod
              </label>

              <MarkdownToolbar
                textareaRef={textareaRef}
                content={content}
                setContent={setContent}
              />

              <textarea
                ref={textareaRef}
                rows={14}
                placeholder="Skriv ditt innehåll här..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="editor-textarea"
              />
            </div>

            {/* Höger: Direkt Förhandsgranskning */}
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.9rem', color: '#475569' }}>
                Direkt förhandsgranskning (Page-vy)
              </label>
              <div className="editor-preview">
                {content ? (
                  <div className="markdown-preview">
                    <ReactMarkdown
                      rehypePlugins={[rehypeRaw]}
                      urlTransform={(value) => value}
                      components={{
                        img: ({ src, alt }, index) => {
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

                          let imageUrl = src;

                          // Om det är en blob-länk från uploader, använd den direkt för levande förhandsgranskning
                          if (src.startsWith('blob:')) {
                            imageUrl = src;
                          } else if (imageItems[index] && imageItems[index].file) {
                            imageUrl = URL.createObjectURL(imageItems[index].file);
                          } else {
                            const filename = src.split('/').pop();
                            imageUrl = `http://localhost:3005/uploads/${filename}`;
                          }

                          const containerStyle = {
                            display: 'block',
                            textAlign: align,
                            margin: '1.5rem 0',
                          };

                          return (
                            <span key={index} style={containerStyle}>
                              <img
                                src={imageUrl}
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
                      {content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="editor-preview-empty">Förhandsgranskning visas här när du skriver...</p>
                )}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="login-cancel" onClick={handleBackClick}>
              Avbryt
            </button>
            <button type="submit" className="header-login-button" disabled={saving}>
              {saving ? 'Sparar...' : 'Publicera page'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
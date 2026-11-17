import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { api } from '../api';
import ImageUploader from '../components/ImageUploader';

export default function EditPage({ page, wikiTitle, onBack }) {
  const [title, setTitle] = useState(page?.title || '');
  const [content, setContent] = useState(page?.content || '');
  const [tags, setTags] = useState(page?.tags || 'test');
  
  const [imageItems, setImageItems] = useState([]);
  const [saving, setSaving] = useState(false);

  const hasUnsavedChanges = title !== page?.title || content !== page?.content;

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
              <textarea
                rows={14}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="form-input markdown-textarea"
              />
            </div>

            {/* Höger: Live Förhandsgranskning */}
            <div className="editor-pane">
              <label className="form-label text-muted">Direkt förhandsgranskning (Page-vy)</label>
              <div className="preview-box">
                {content ? (
                  <div className="markdown-preview">
                    <ReactMarkdown
                      urlTransform={(value) => value}
                      components={{
                        img: ({ src, alt }) => {
                          if (!src) return null;

                          let imageUrl = src;
                          let align = 'center';
                          let width = '100%';

                          if (src.includes('?')) {
                            const parts = src.split('?');
                            imageUrl = parts[0];
                            const params = new URLSearchParams(parts[1]);
                            
                            if (params.get('align')) align = params.get('align');
                            if (params.get('width')) width = params.get('width') + '%';
                          }

                          // Inline styles behålls här eftersom 'align' och 'width' är dynamiska värden från URL-parametrarna
                          return (
                            <span style={{ display: 'block', textAlign: align, margin: '1rem 0' }}>
                              <img 
                                src={imageUrl} 
                                alt={alt || 'Bild'} 
                                style={{ width: width, maxWidth: '100%', borderRadius: '6px', display: 'inline-block' }} 
                              />
                              {alt && <span className="image-caption">{alt}</span>}
                            </span>
                          );
                        }
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
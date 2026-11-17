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

        <form onSubmit={handleSave} style={{ background: '#fff', padding: '24px', borderRadius: '14px', border: '1px solid #e1e7f0' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Taggar</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
            />
          </div>

          {/* Bildkomponent med parametrar */}
          <ImageUploader onImageAdded={handleImageAdded} />

          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            
            {/* Vänster: Textarea */}
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.9rem', color: '#475569' }}>
                Markdown-kod
              </label>
              <textarea
                rows={14}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>

            {/* Höger: Live Förhandsgranskning med samma bildhantering */}
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.9rem', color: '#475569' }}>
                Direkt förhandsgranskning (Page-vy)
              </label>
              <div style={{ minHeight: '307px', maxHeight: '350px', overflowY: 'auto', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', lineHeight: '1.6', boxSizing: 'border-box' }}>
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

                          let containerStyle = { 
                            display: 'block', 
                            textAlign: align, 
                            margin: '1rem 0' 
                          };

                          return (
                            <span style={containerStyle}>
                              <img 
                                src={imageUrl} 
                                alt={alt || 'Bild'} 
                                style={{ width: width, maxWidth: '100%', borderRadius: '6px', display: 'inline-block' }} 
                              />
                              {alt && <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>{alt}</span>}
                            </span>
                          );
                        }
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>Förhandsgranskning visas här när du skriver...</p>
                )}
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="login-cancel" onClick={handleBackClick}>
              Avbryt
            </button>
            <button type="submit" className="header-login-button" disabled={saving}>
              {saving ? 'Sparar...' : 'Spara ändringar'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
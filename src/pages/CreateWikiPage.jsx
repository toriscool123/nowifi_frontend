import { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../api';
import ImageUploader from '../components/ImageUploader';
import TipTapEditor from '../components/TipTapEditor';
import { ShowWikiPage } from '../components/ShowWikiPage';

function parseTagsToArray(rawTags) {
  if (Array.isArray(rawTags)) {
    return rawTags.map((t) => String(t).trim()).filter(Boolean);
  }
  if (typeof rawTags === 'string') {
    return rawTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

function isEmptyHtml(html) {
  if (!html) return true;
  const stripped = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
  return stripped.length === 0 && !html.includes('<img');
}

export default function CreatePage({ wikiId, wikiTitle, onBack, onCreated }) {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [imageItems, setImageItems] = useState([]);
  const [saving, setSaving] = useState(false);

  const editorRef = useRef(null);

  const hasUnsavedChanges =
    title.trim() !== '' || tags.trim() !== '' || !isEmptyHtml(content) || imageItems.length > 0;

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
    setImageItems((prev) => [...prev, { file: newItem.file, caption: newItem.caption }]);

    const editor = editorRef.current;
    const blobUrl = newItem.file ? URL.createObjectURL(newItem.file) : '';
    const captionHtml =
      newItem.caption && newItem.caption.trim()
        ? `<p style="font-size:0.85rem;color:#64748b;margin-top:6px;">${newItem.caption.trim()}</p>`
        : '';

    if (editor && blobUrl) {
      editor
        .chain()
        .focus()
        .setImage({
          src: blobUrl,
          alt: newItem.caption || 'Bild',
        })
        .run();

      if (captionHtml) {
        setContent((prev) => `${prev}${captionHtml}`);
      }
    } else if (newItem.markdownSnippet) {
      setContent((prev) => `${prev}\n${newItem.markdownSnippet}\n`);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim()) return alert('Du måste ange en titel!');

    setSaving(true);
    try {
      const tagsArray = parseTagsToArray(tags);
      const formData = new FormData();
      if (wikiId) {
        formData.append('wiki_id', wikiId);
      }
      formData.append('title', title.trim());
      formData.append('content', content);
      formData.append('status', 'published');
      formData.append('tags', tagsArray.join(', '));

      imageItems.forEach((item) => {
        formData.append('images[]', item.file);
        formData.append('captions[]', item.caption);
      });

      const data = await api('w_page_create', 'POST', formData);

      if (data.success) {
        if (typeof onCreated === 'function') {
          onCreated(data);
        } else {
          onBack();
        }
      } else {
        alert(data.message || 'Kunde inte skapa sidan.');
      }
    } catch (err) {
      console.error('Fel vid skapande:', err);
      alert('Ett nätverksfel uppstod.');
    } finally {
      setSaving(false);
    }
  }

  const tagsArray = useMemo(() => parseTagsToArray(tags), [tags]);

  const previewImages = useMemo(
    () =>
      imageItems.map((item, idx) => ({
        image_id: `new-img-${idx}`,
        file_path: URL.createObjectURL(item.file),
        caption: item.caption || '',
      })),
    [imageItems]
  );

  return (
    <div className="home">
      <header className="home-header">
        <button className="text-button" type="button" onClick={handleBackClick}>
          ← Tillbaka till {wikiTitle ?? 'wikin'}
        </button>
      </header>

      <main className="home-content">
        <section className="wiki-heading">
          <p className="eyebrow">{wikiTitle}</p>
          <h1>Skapa page</h1>
        </section>

        <form onSubmit={handleCreate} className="form-card">
          <div className="form-group">
            <label className="form-label">Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sidtitel..."
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Taggar (kommaseparerade, t.ex. tag1, tag2, tag3)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="form-input"
            />
          </div>

          <ImageUploader onImageAdded={handleImageAdded} />

          <div
            className="editor-split"
            style={{
              alignItems: 'flex-start',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div
              className="editor-pane"
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                flex: '1 1 100%',
              }}
            >
              <label className="form-label text-muted">Visuell editor (TipTap)</label>
              <TipTapEditor
                editorRef={editorRef}
                value={content}
                onChange={setContent}
                placeholder="Skriv din wiki-sida här..."
              />
            </div>

            <div
              style={{
                flex: '1 1 100%',
                width: '100%',
                minWidth: '300px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontWeight: 600,
                  marginBottom: '6px',
                  fontSize: '0.9rem',
                  color: '#475569',
                }}
              >
                Direkt förhandsgranskning (Page-vy)
              </label>

              <div
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  minHeight: '355px',
                  height: '355px',
                  resize: 'vertical',
                  overflowX: 'hidden',
                  overflowY: 'auto',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  boxSizing: 'border-box',
                }}
              >
                {!isEmptyHtml(content) ? (
                  <ShowWikiPage
                    page={{
                      title: title || 'Ny sida',
                      tags: tagsArray,
                      content,
                      images: previewImages,
                    }}
                    wikiTitle={wikiTitle}
                    showBackButton={false}
                  />
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
              {saving ? 'Skapar...' : 'Skapa sida'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
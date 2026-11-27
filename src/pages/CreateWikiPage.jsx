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

function isEmptyContent(html) {
  if (!html) return true;
  const stripped = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
  return stripped.length === 0 && !html.includes('<img');
}

function buildImageStyle(width, align) {
  const cleanWidth = String(width || '100').replace(/[^0-9]/g, '') || '100';
  const widthCss = `width: ${cleanWidth}%; height: auto;`;

  if (align === 'left') {
    return `${widthCss} display: block; margin-right: auto; margin-left: 0;`;
  }
  if (align === 'right') {
    return `${widthCss} display: block; margin-left: auto; margin-right: 0;`;
  }
  return `${widthCss} display: block; margin-left: auto; margin-right: auto;`;
}

export default function CreatePage({ wikiId, wikiTitle, onBack, onCreated }) {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [imageItems, setImageItems] = useState([]);
  const [saving, setSaving] = useState(false);

  const editorRef = useRef(null);
  const blobUrlsRef = useRef([]);

  // Rensa skapade blob-URL:er när komponenten stängs
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Filtrera bort bilder som användaren har raderat ur TipTap-editorn
  const activeImageItems = useMemo(() => {
    return imageItems.filter((item) => item.blobUrl && content.includes(item.blobUrl));
  }, [imageItems, content]);

  const hasUnsavedChanges =
    title.trim() !== '' ||
    tags.trim() !== '' ||
    !isEmptyContent(content) ||
    activeImageItems.length > 0;

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
    const blobUrl = newItem.file ? URL.createObjectURL(newItem.file) : '';
    if (blobUrl) {
      blobUrlsRef.current.push(blobUrl);
    }

    setImageItems((prev) => [
      ...prev,
      {
        file: newItem.file,
        caption: newItem.caption || '',
        blobUrl,
      },
    ]);

    const activeEditor = editorRef.current?.editor || editorRef.current;

    if (!blobUrl || !activeEditor?.chain) {
      if (newItem.markdownSnippet) {
        setContent((prev) => `${prev}\n${newItem.markdownSnippet}\n`);
      }
      return;
    }

    const caption = (newItem.caption || '').trim();
    const alt = caption || newItem.file?.name || 'Bild';
    const widthVal = String(newItem.width || '100').replace(/[^0-9]/g, '') || '100';
    const alignVal = newItem.align || newItem.alignment || 'center';
    const imgStyle = buildImageStyle(widthVal, alignVal);

    const imageAttrs = {
      src: blobUrl,
      alt,
      style: imgStyle,
      width: `${widthVal}%`,
    };

    if (caption) {
      activeEditor
        .chain()
        .focus()
        .insertContent([
          {
            type: 'image',
            attrs: imageAttrs,
          },
          {
            type: 'paragraph',
            attrs: {
              style: `text-align: ${alignVal}; font-size: 0.85rem; color: #55635f; margin-top: 6px;`,
            },
            content: [
              {
                type: 'text',
                marks: [{ type: 'italic' }],
                text: caption,
              },
            ],
          },
        ])
        .run();
    } else {
      activeEditor
        .chain()
        .focus()
        .insertContent([
          {
            type: 'image',
            attrs: imageAttrs,
          },
        ])
        .run();
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

      // Ladda bara upp bilder som fortfarande finns kvar i editorns innehåll
      activeImageItems.forEach((item) => {
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
        alert(data.error || data.message || 'Kunde inte skapa sidan.');
      }
    } catch (err) {
      console.error('Fel vid skapande:', err);
      alert('Ett nätverksfel uppstod.');
    } finally {
      setSaving(false);
    }
  }

  const tagsArray = useMemo(() => parseTagsToArray(tags), [tags]);

  return (
    <div className="home">
      <header className="home-header">
      </header>

      <main className="home-content">
        <button className="text-button" type="button" onClick={handleBackClick}>
          ← Tillbaka till {wikiTitle ?? 'wikin'}
        </button>
        <div aria-hidden="true" style={{ height: '1rem' }} />
        <section className="wiki-heading">
          <p className="eyebrow">{wikiTitle}</p>
          <h1>Skapa page</h1>
          <div aria-hidden="true" style={{ height: '1rem' }} />
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
              placeholder="skriv i fältet..."
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
                {!isEmptyContent(content) ? (
                  <ShowWikiPage
                    page={{
                      title: title || 'Ny sida',
                      tags: tagsArray,
                      content,
                      images: [],
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
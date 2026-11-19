import { useState, useEffect, useRef, useMemo } from 'react';
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

  // Historik-states
  const [historyList, setHistoryList] = useState([]);
  const [selectedHistoryKey, setSelectedHistoryKey] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'

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

  function resolveDbImagesInMarkdown(rawContent, imagesFromDb) {
    if (!rawContent) return '';

    let imgIndex = 0;

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

        if (baseUrl.startsWith('blob:')) {
          const dbImage = imagesFromDb?.[currentIdx];
          if (dbImage?.file_path) {
            return `![${altText}](${getAbsoluteImageUrl(dbImage.file_path)}${querySuffix})`;
          }
          if (altText && /\.(jpe?g|png|gif|webp)$/i.test(altText.trim())) {
            return `![${altText}](${getAbsoluteImageUrl(`uploads/${altText.trim()}`)}${querySuffix})`;
          }
        }

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

  useEffect(() => {
    const resolved = resolveDbImagesInMarkdown(page?.content || '', page?.images || []);
    setTitle(page?.title || '');
    setTags(page?.tags || 'test');
    setContent(resolved);
    setImageItems([]);
    setSelectedHistoryKey('');
    setHistoryFilter('');
  }, [page]);

  // Hämta sidhistorik från backend
  useEffect(() => {
    const pageId = page?.id || page?.page_id;
    if (!pageId) return;

    let cancelled = false;

    async function loadHistory() {
      const inlineHistory = page?.history || page?.versions || page?.revisions;
      if (Array.isArray(inlineHistory) && inlineHistory.length > 0) {
        if (!cancelled) setHistoryList(inlineHistory);
        return;
      }

      setLoadingHistory(true);
      try {
        const data = await api('w_page_history', 'GET', { page_id: pageId });
        const list =
          data?.history ||
          data?.versions ||
          data?.revisions ||
          data?.items ||
          (Array.isArray(data?.data) ? data.data : []);

        if (!cancelled && data?.success && Array.isArray(list)) {
          setHistoryList(list);
        }
      } catch (err) {
        console.debug('Historik kunde inte laddas:', err);
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [page]);

  function extractAuthor(item) {
    if (!item || typeof item !== 'object') return null;

    if (typeof item.user === 'object' && item.user !== null) {
      const nestedUser =
        item.user.username || item.user.user_name || item.user.name || item.user.email;
      if (nestedUser) return String(nestedUser);
    }

    const nameCandidates = [
      item.username,
      item.user_name,
      item.edited_by_username,
      item.edited_by_name,
      item.author,
      item.edited_by,
      item.changed_by_name,
      item.changed_by,
      item.created_by_name,
      item.created_by,
      item.updated_by_name,
      item.updated_by,
      item.editor,
      item.full_name,
      item.name,
      typeof item.user === 'string' ? item.user : null,
    ];

    const foundName = nameCandidates.find(
      (val) => typeof val === 'string' && val.trim().length > 0
    );
    if (foundName) return foundName.trim();

    const userId = item.edited_by_user_id ?? item.user_id ?? item.created_by_user_id;
    if (userId !== undefined && userId !== null && String(userId).trim() !== '') {
      return `Användare #${userId}`;
    }

    return null;
  }

  function getItemTimestamp(item) {
    const rawDate =
      item?.edited_at ||
      item?.updated_at ||
      item?.modified_at ||
      item?.changed_at ||
      item?.created_at ||
      item?.saved_at ||
      item?.date_updated ||
      item?.date_created ||
      item?.timestamp ||
      item?.date ||
      item?.created;

    if (!rawDate) return 0;

    const normalized =
      typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(rawDate.trim())
        ? rawDate.trim().replace(' ', 'T')
        : rawDate;

    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }

  function extractDateTime(item, fallbackIndex) {
    const rawDate =
      item?.edited_at ||
      item?.updated_at ||
      item?.modified_at ||
      item?.changed_at ||
      item?.created_at ||
      item?.saved_at ||
      item?.date_updated ||
      item?.date_created ||
      item?.timestamp ||
      item?.date ||
      item?.created;

    if (rawDate) {
      const normalized =
        typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(rawDate.trim())
          ? rawDate.trim().replace(' ', 'T')
          : rawDate;

      const parsed = new Date(normalized);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleString('sv-SE', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
      }

      return String(rawDate);
    }

    return `Version #${fallbackIndex + 1}`;
  }

  function getSnapshotSignature(item) {
    const snapTitle = (item?.title ?? '').trim();
    const snapTags = (item?.tags ?? '').trim();
    const snapContent = (item?.content ?? item?.body ?? item?.markdown ?? '').trim();
    return `${snapTitle}|||${snapTags}|||${snapContent}`;
  }

  // Berika, dölj identiska dubbletter, filtrera och sortera historiken
  const processedHistory = useMemo(() => {
    const enriched = historyList.map((item, idx) => {
      const versionNum = item?.version_number ?? idx + 1;
      const author = extractAuthor(item) || 'Okänd användare';
      const dateTime = extractDateTime(item, idx);
      const timestamp = getItemTimestamp(item);
      const uniqueKey = String(item?.history_id ?? item?.id ?? `hist-${idx}`);
      const label = `v${versionNum} — ${dateTime} (${author})`;

      return {
        item,
        idx,
        uniqueKey,
        versionNum,
        author,
        dateTime,
        timestamp,
        label,
        signature: getSnapshotSignature(item),
      };
    });

    const chronological = [...enriched].sort((a, b) => {
      if (a.timestamp && b.timestamp && a.timestamp !== b.timestamp) {
        return a.timestamp - b.timestamp;
      }
      return Number(a.versionNum) - Number(b.versionNum);
    });

    const withoutDuplicates = chronological.filter((entry, i) => {
      if (i === 0) return true;
      return entry.signature !== chronological[i - 1].signature;
    });

    const q = historyFilter.trim().toLowerCase();
    const filtered = q
      ? withoutDuplicates.filter(
          (entry) =>
            entry.author.toLowerCase().includes(q) ||
            entry.dateTime.toLowerCase().includes(q) ||
            String(entry.versionNum).includes(q) ||
            entry.label.toLowerCase().includes(q)
        )
      : withoutDuplicates;

    return [...filtered].sort((a, b) => {
      const cmp =
        a.timestamp && b.timestamp && a.timestamp !== b.timestamp
          ? a.timestamp - b.timestamp
          : Number(a.versionNum) - Number(b.versionNum);
      return sortOrder === 'newest' ? -cmp : cmp;
    });
  }, [historyList, historyFilter, sortOrder]);

  function handleSelectHistory(e) {
    const key = e.target.value;
    setSelectedHistoryKey(key);

    if (!key) return;

    const found = processedHistory.find((entry) => entry.uniqueKey === key);
    const entry = found?.item;
    if (!entry) return;

    const histContent = entry.content ?? entry.body ?? entry.markdown ?? '';
    setContent(resolveDbImagesInMarkdown(histContent, page?.images || []));

    if (typeof entry.title === 'string') {
      setTitle(entry.title);
    }
    if (typeof entry.tags === 'string') {
      setTags(entry.tags);
    }
  }

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

          {/* Historik-väljare med sök och sortering */}
          <div
            className="form-group"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <label
                htmlFor="page-history-select"
                className="form-label"
                style={{ marginBottom: 0, fontWeight: 600 }}
              >
                Versionshistorik
              </label>

              <select
                id="page-history-select"
                value={selectedHistoryKey}
                onChange={handleSelectHistory}
                disabled={loadingHistory || processedHistory.length === 0}
                className="form-input"
                style={{ width: 'auto', minWidth: '260px', flex: '1 1 320px' }}
              >
                <option value="">
                  {loadingHistory
                    ? 'Laddar historik...'
                    : processedHistory.length > 0
                    ? `Välj version (${processedHistory.length} träffar)...`
                    : 'Ingen historik matchar'}
                </option>
                {processedHistory.map((entry) => (
                  <option key={entry.uniqueKey} value={entry.uniqueKey}>
                    {entry.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
              >
                {sortOrder === 'newest' ? '↓ Nyast först' : '↑ Äldst först'}
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <input
                type="text"
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                placeholder="Sök datum, tid, användare eller v#..."
                className="form-input"
                style={{
                    width: '100%',
                    flex: '1 1 220px',
                    padding: '7px 12px',
                    fontSize: '0.88rem',
                }}
                />
            </div>
          </div>

          <ImageUploader onImageAdded={handleImageAdded} />

          <div className="editor-split" style={{ alignItems: 'flex-start' }}>
            {/* Vänster: Textarea */}
            <div className="editor-pane" style={{ display: 'flex', flexDirection: 'column' }}>
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
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
                  minHeight: '355px',
                  height: '355px',
                  resize: 'vertical',
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
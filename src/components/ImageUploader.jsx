import { useRef, useState } from 'react';

export default function ImageUploader({ onImageAdded }) {
  const [currentImage, setCurrentImage] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [caption, setCaption] = useState('');
  const [align, setAlign] = useState('center');
  const [width, setWidth] = useState('100');

  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setCurrentImage(file);
      setPreviewSrc(URL.createObjectURL(file));
    } else {
      setCurrentImage(null);
      setPreviewSrc(null);
    }
  }

  function handleInsert() {
    if (!currentImage) return;

    const cleanWidth = String(width || '100').replace(/[^0-9]/g, '') || '100';
    const altText = caption || currentImage.name;
    const markdownSnippet = `![${altText}](${previewSrc}?align=${align}&width=${cleanWidth})`;

    onImageAdded({
      file: currentImage,
      caption: caption || '',
      width: cleanWidth,
      align,
      markdownSnippet,
    });

    setCurrentImage(null);
    setPreviewSrc(null);
    setCaption('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  const isDisabled = !currentImage;

  return (
    <div className="image-uploader-wrapper">
      <label className="uploader-title">Lägg till bild med parametrar</label>

      <div className="uploader-grid">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="file-input"
        />
        <input
          type="text"
          placeholder="Bildtext (caption)..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="form-input"
        />
      </div>

      {previewSrc && (
        <div className="image-preview-card">
          <img src={previewSrc} alt="Miniatyr" className="preview-thumbnail" />
          <span className="preview-filename">Vald bild: {currentImage?.name}</span>
        </div>
      )}

      <div className="uploader-settings">
        <label className="setting-label">
          Justering:
          <select
            value={align}
            onChange={(e) => setAlign(e.target.value)}
            className="setting-input"
          >
            <option value="center">Center</option>
            <option value="left">Vänster</option>
            <option value="right">Höger</option>
          </select>
        </label>

        <label className="setting-label">
          Bredd (%):
          <input
            type="text"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            className="setting-input width-input"
          />
        </label>

        <button
          type="button"
          disabled={isDisabled}
          onClick={handleInsert}
          className={`btn btn-sm ${isDisabled ? 'btn-insert-disabled' : 'btn-primary'}`}
          style={
            isDisabled
              ? {
                  backgroundColor: '#cbd5e1',
                  borderColor: '#94a3b8',
                  color: '#475569',
                  opacity: 1,
                  cursor: 'not-allowed',
                }
              : undefined
          }
        >
          Infoga bild i text
        </button>
      </div>
    </div>
  );
}
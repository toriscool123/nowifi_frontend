import { useState } from 'react';

export default function ImageUploader({ onImageAdded }) {
  const [currentImage, setCurrentImage] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [caption, setCaption] = useState('');
  const [align, setAlign] = useState('center');
  const [width, setWidth] = useState('100');

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      setCurrentImage(file);
      setPreviewSrc(URL.createObjectURL(file));
    }
  }

  function handleInsert() {
    if (!currentImage) return alert('Välj en bild först!');

    const altText = caption || currentImage.name;
    
    // DET HÄR MÅSTE VARA EXAKT EN ENDA LÅNG RAD UTAN RADBRYTNINGAR
    const markdownSnippet = `![${altText}](${previewSrc}?align=${align}&width=${width})`;
    
    onImageAdded({
      file: currentImage,
      caption: caption || '',
      markdownSnippet
    });

    setCurrentImage(null);
    setPreviewSrc(null);
    setCaption('');
  }

  return (
    <div className="image-uploader-wrapper">
      <label className="uploader-title">Lägg till bild med parametrar</label>
      
      <div className="uploader-grid">
        <input type="file" onChange={handleFileChange} className="file-input" />
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
          <span className="preview-filename">Vald bild: {currentImage.name}</span>
        </div>
      )}

      <div className="uploader-settings">
        <label className="setting-label">
          Justering:
          <select value={align} onChange={(e) => setAlign(e.target.value)} className="setting-input">
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
          className="btn btn-primary btn-sm"
          onClick={handleInsert}
        >
          Infoga bild i text
        </button>
      </div>
    </div>
  );
}
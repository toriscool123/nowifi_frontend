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
    
    // Använd blob-länken för direkt live-förhandsgranskning i formuläret
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
    <div style={{ marginBottom: '16px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e1e7f0' }}>
      <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Lägg till bild med parametrar</label>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
        <input type="file" onChange={handleFileChange} />
        <input 
          type="text" 
          placeholder="Bildtext (caption)..." 
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
        />
      </div>

      {previewSrc && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0', padding: '8px', background: '#fff', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
          <img src={previewSrc} alt="Miniatyr" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
          <span style={{ fontSize: '0.85rem', color: '#334155' }}>Vald bild: {currentImage.name}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
        <label style={{ fontSize: '0.9rem' }}>
          Justering:
          <select value={align} onChange={(e) => setAlign(e.target.value)} style={{ marginLeft: '6px', padding: '4px' }}>
            <option value="center">Center</option>
            <option value="left">Vänster</option>
            <option value="right">Höger</option>
          </select>
        </label>

        <label style={{ fontSize: '0.9rem' }}>
          Bredd (%):
          <input 
            type="text" 
            value={width} 
            onChange={(e) => setWidth(e.target.value)} 
            style={{ width: '60px', marginLeft: '6px', padding: '4px' }} 
          />
        </label>

        <button 
          type="button" 
          className="header-login-button"
          style={{ marginTop: 0, padding: '6px 14px' }}
          onClick={handleInsert}
        >
          Infoga bild i text
        </button>
      </div>
    </div>
  );
}
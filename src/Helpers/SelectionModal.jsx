import { useState } from 'react';

export default function SelectionModal({ 
  title, 
  items, // array av strängar (t.ex. grupper) eller objekt (t.ex. användare med .username)
  selectedItems, 
  onToggleItem, 
  onConfirm, 
  onClose, 
  loading,
  confirmButtonText = 'Lägg till',
  confirmButtonStyle = {}
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrera objekt oavsett om det är en array av strängar eller objekt
  const filteredItems = items.filter(item => {
    const name = typeof item === 'string' ? item : (item.username || item.name || item.group || '');
    return name.toLowerCase().includes(searchQuery.trim().toLowerCase());
  });

  return (
    <div style={modalOverlayStyle}>
      <div style={{ ...modalContentStyle, maxWidth: '450px' }}>
        <h3>{title}</h3>
        
        <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
          <input
            type="search"
            placeholder="Sök..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ ...inputStyle, marginBottom: '4px' }}
          />

          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px', display: 'grid', gap: '6px' }}>
            {loading ? (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '10px' }}>Laddar...</p>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item, idx) => {
                const name = typeof item === 'string' ? item : (item.username || item.name || item.group || '');
                const isChecked = selectedItems.includes(name);

                return (
                  <div
                    key={idx}
                    onClick={() => onToggleItem(name)}
                    style={{
                      padding: '10px 12px',
                      background: isChecked ? '#eff6ff' : '#f8fafc',
                      border: isChecked ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ fontWeight: 600, color: '#17243b' }}>{name}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                    />
                  </div>
                );
              })
            ) : (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '10px' }}>Inga alternativ att visa.</p>
            )}
          </div>

          <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0 }}>
            Valda ({selectedItems.length}): <strong>{selectedItems.join(', ') || 'Inga valda'}</strong>
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={cancelButtonStyle}>Avbryt</button>
            <button 
              type="button" 
              onClick={onConfirm}
              disabled={selectedItems.length === 0} 
              style={{ ...submitButtonStyle, ...confirmButtonStyle, opacity: selectedItems.length > 0 ? 1 : 0.6, cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed' }}
            >
              {confirmButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stilmallar för modalen
const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  zIndex: 1000
};

const modalContentStyle = {
  background: '#fff', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
};

const inputStyle = {
  padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', width: '100%'
};

const cancelButtonStyle = {
  padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px',
  cursor: 'pointer', fontWeight: 600, color: '#475569'
};

const submitButtonStyle = {
  padding: '8px 16px', background: '#17243b', color: '#fff', border: 'none', borderRadius: '6px',
  cursor: 'pointer', fontWeight: 600
};
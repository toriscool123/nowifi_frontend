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
    <div className="modal-overlay">
      <div className="modal-content selection-modal">
        <h3>{title}</h3>
        
        <div className="modal-body">
          <input
            type="search"
            placeholder="Sök..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input search-input"
          />

          <div className="scroll-list">
            {loading ? (
              <p className="empty-state text-center">Laddar...</p>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item, idx) => {
                const name = typeof item === 'string' ? item : (item.username || item.name || item.group || '');
                const isChecked = selectedItems.includes(name);

                return (
                  <div
                    key={idx}
                    onClick={() => onToggleItem(name)}
                    className={`selectable-list-item ${isChecked ? 'selected' : ''}`}
                  >
                    <span className="item-name">{name}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // Hanteras av onClick på föräldern
                      className="item-checkbox"
                    />
                  </div>
                );
              })
            ) : (
              <p className="empty-state text-center">Inga alternativ att visa.</p>
            )}
          </div>

          <p className="selection-summary">
            Valda ({selectedItems.length}): <strong>{selectedItems.join(', ') || 'Inga valda'}</strong>
          </p>

          <div className="modal-footer">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-secondary"
            >
              Avbryt
            </button>
            <button 
              type="button" 
              onClick={onConfirm}
              disabled={selectedItems.length === 0} 
              className="btn btn-primary"
              style={confirmButtonStyle} // Behåll eventuella custom overrides som skickas via props
            >
              {confirmButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
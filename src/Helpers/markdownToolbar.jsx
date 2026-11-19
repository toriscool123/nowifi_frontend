import React, { useState, useRef, useEffect } from 'react';

export default function MarkdownToolbar({ textareaRef, content, setContent }) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#1b4332');
  const popoverRef = useRef(null);

  // Stäng popovern om man klickar utanför
  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setShowColorPicker(false);
      }
    }
    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColorPicker]);

  const insertFormat = (prefix, suffix = '', defaultText = 'text') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || defaultText;

    const newText =
      content.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      content.substring(end);

    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 0);
  };

  const handleApplyColor = () => {
    insertFormat(`<span style="color: ${selectedColor}">`, '</span>', 'färgad text');
    setShowColorPicker(false);
  };

  return (
    <div style={toolbarStyle}>
      {/* Rubriker */}
      <button type="button" onClick={() => insertFormat('# ', '', 'Rubrik 1')} style={btnStyle}>
        H1
      </button>
      <button type="button" onClick={() => insertFormat('## ', '', 'Rubrik 2')} style={btnStyle}>
        H2
      </button>
      <button type="button" onClick={() => insertFormat('### ', '', 'Rubrik 3')} style={btnStyle}>
        H3
      </button>

      <span style={dividerStyle} />

      {/* Textformatering */}
      <button type="button" onClick={() => insertFormat('**', '**', 'fet text')} style={btnStyle}>
        <b>B</b>
      </button>
      <button type="button" onClick={() => insertFormat('*', '*', 'kursiv text')} style={btnStyle}>
        <i>I</i>
      </button>
      <button type="button" onClick={() => insertFormat('- ', '', 'listpunkt')} style={btnStyle}>
        • Lista
      </button>

      <span style={dividerStyle} />

      {/* Färgväljare */}
      <div style={{ position: 'relative' }} ref={popoverRef}>
        <button
          type="button"
          onClick={() => setShowColorPicker((prev) => !prev)}
          style={{ ...btnStyle, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <span>Färg</span>
          <span
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '3px',
              backgroundColor: selectedColor,
              border: '1px solid #9ca3af',
              display: 'inline-block',
            }}
          />
        </button>

        {showColorPicker && (
          <div style={popoverStyle}>
            {/* Knappar högst upp så att färghjulet nedanför inte täcker dem */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: '#374151',
                  fontWeight: 600,
                }}
              >
                {selectedColor}
              </span>

              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setShowColorPicker(false)}
                  style={{ ...smallBtnStyle, backgroundColor: '#f3f4f6', color: '#374151' }}
                >
                  Avbryt
                </button>
                <button
                  type="button"
                  onClick={handleApplyColor}
                  style={{ ...smallBtnStyle, backgroundColor: '#1b4332', color: '#ffffff' }}
                >
                  Spara färg
                </button>
              </div>
            </div>

            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              style={{
                width: '100%',
                height: '32px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const toolbarStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  padding: '8px',
  backgroundColor: '#f3f4f6',
  border: '1px solid #d1d5db',
  borderBottom: 'none',
  borderRadius: '6px 6px 0 0',
  alignItems: 'center',
};

const btnStyle = {
  padding: '4px 10px',
  backgroundColor: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '500',
};

const dividerStyle = {
  width: '1px',
  height: '20px',
  backgroundColor: '#d1d5db',
  margin: '0 4px',
};

const popoverStyle = {
  position: 'absolute',
  bottom: '120%',
  left: 0,
  zIndex: 20,
  backgroundColor: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  padding: '10px',
  boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.12)',
  minWidth: '210px',
};

const smallBtnStyle = {
  padding: '4px 8px',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  fontSize: '12px',
  cursor: 'pointer',
  fontWeight: '500',
};
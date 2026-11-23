import React from 'react';

function Help({ onClick }) {
  return (
    <div className="help">
      <button className="text-button" type="button" onClick={onClick}>
        Hjälp?
      </button>
    </div>
  );
}

export default Help;
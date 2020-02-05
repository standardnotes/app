import React from 'react';

export function TitleBarHeader({ panelTitle, onCreateNote }) {
  return <>
    <div className="title">{panelTitle}</div>
    <button
      onClick={onCreateNote}
      className="sk-button contrast wide"
      title="Create a new note in the selected tag">
      <div className="sk-label">
        <i className="icon ion-plus add-button" />
      </div>
    </button>
  </>;
};

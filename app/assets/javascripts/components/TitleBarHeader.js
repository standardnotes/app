import React from 'react';
import { makeAngularComponent } from './utils';

function TitleBarHeader({ title, onButtonClick }) {
  return (
    <div className="section-title-bar-header">
      <div className="title">{title}</div>
      <button
        onClick={onButtonClick}
        className="sk-button contrast wide"
        title="Create a new note in the selected tag"
      >
        <div className="sk-label">
          <i className="icon ion-plus add-button" />
        </div>
      </button>
    </div>
  );
}

export const ngTitleBarHeader = makeAngularComponent(
  TitleBarHeader,
  'titleBarHeader',
  {
    title: '<',
    onButtonClick: '&'
  }
);

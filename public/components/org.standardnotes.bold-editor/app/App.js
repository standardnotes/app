import React from 'react';
import Editor from '@Components/Editor';

export default class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div id="editor-container">
        <div key="editor" id="editor">
          <Editor />
        </div>
      </div>
    );
  }
}

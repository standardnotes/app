import React from 'react';
import ComponentRelay from '@standardnotes/component-relay';
const MarkdownIt = require('markdown-it');

const EditMode = 0;
const SplitMode = 1;
const PreviewMode = 2;

export default class Home extends React.Component {

  constructor(props) {
    super(props);

    this.modes = [
      { mode: EditMode, label: 'Edit', css: 'edit' },
      { mode: SplitMode, label: 'Split', css: 'split' },
      { mode: PreviewMode, label: 'Preview', css: 'preview' },
    ];

    this.state = { mode: this.modes[0] };
  }

  componentDidMount() {
    this.simpleMarkdown = document.getElementById('simple-markdown');
    this.editor = document.getElementById('editor');
    this.preview = document.getElementById('preview');

    this.configureMarkdown();
    this.connectToBridge();
    this.updatePreviewText();
    this.addChangeListener();

    this.configureResizer();
    this.addTabHandler();

    this.scrollTriggers = {};
    this.scrollHandlers = [
      { el: this.editor, handler: this.scrollHandler(this.editor, this.preview) },
      { el: this.preview, handler: this.scrollHandler(this.preview, this.editor) }
    ];
  }

  UNSAFE_componentWillUpdate(nextProps, nextState) {
    let prevMode = this.state.mode.mode;
    let nextMode = nextState.mode.mode;

    // If we changed to Split mode we add the scroll listeners
    if (prevMode !== nextMode) {
      if (nextMode === SplitMode) {
        this.addScrollListeners();
      } else {
        this.removeScrollListeners();
      }
    }
  }

  setModeFromModeValue(value) {
    for (let mode of this.modes) {
      if (mode.mode == value) {
        this.setState({ mode });
        return;
      }
    }
  }

  changeMode(mode) {
    this.setState({ mode });
    if (!this.note) {
      return;
    }
    this.note.clientData = { mode: mode.mode };
    this.componentRelay.saveItem(this.note);
  }

  configureMarkdown() {
    const markdownitOptions = {
      // automatically render raw links as anchors.
      linkify: true,
      // Convert '\n' in paragraphs into <br>
      breaks: true
    };

    this.markdown = MarkdownIt(markdownitOptions)
      .use(require('markdown-it-footnote'))
      .use(require('markdown-it-task-lists'))
      .use(require('markdown-it-highlightjs'));

    // Remember old renderer, if overriden, or proxy to default renderer
    const defaultRender = this.markdown.renderer.rules.link_open || ((tokens, idx, options, env, self) => {
      return self.renderToken(tokens, idx, options);
    });

    this.markdown.renderer.rules.link_open = ((tokens, idx, options, env, self) => {
      // If you are sure other plugins can't add `target` - drop check below
      const aIndex = tokens[idx].attrIndex('target');

      if (aIndex < 0) {
        tokens[idx].attrPush(['target', '_blank']); // add new attribute
      } else {
        tokens[idx].attrs[aIndex][1] = '_blank';    // replace value of existing attr
      }

      // pass token to default renderer.
      return defaultRender(tokens, idx, options, env, self);
    });
  }

  connectToBridge() {
    const initialPermissions = [
      {
        name: 'stream-context-item'
      }
    ];

    this.componentRelay = new ComponentRelay({
      initialPermissions,
      targetWindow: window,
      onReady: () => {
        const { platform } = this.componentRelay;
        this.setState({ platform });
      }
    });

    this.componentRelay.streamContextItem((note) => {
      this.note = note;

      if (note.clientData) {
        const mode = note.clientData.mode ?? EditMode;
        this.setModeFromModeValue(mode);
      }

      // Only update UI on non-metadata updates.
      if (note.isMetadataUpdate) {
        return;
      }

      this.editor.value = note.content.text;
      this.preview.innerHTML = this.markdown.render(note.content.text);
    });
  }

  truncateString(string, limit = 80) {
    if (!string) {
      return null;
    }
    if (string.length <= limit) {
      return string;
    } else {
      return string.substring(0, limit) + '...';
    }
  }

  updatePreviewText() {
    const text = this.editor.value || '';
    this.preview.innerHTML = this.markdown.render(text);
    return text;
  }

  addChangeListener() {
    document.getElementById('editor').addEventListener('input', () => {
      if (this.note) {
        // Be sure to capture this object as a variable, as this.note may be reassigned in `streamContextItem`, so by the time
        // you modify it in the presave block, it may not be the same object anymore, so the presave values will not be applied to
        // the right object, and it will save incorrectly.
        let note = this.note;

        this.componentRelay.saveItemWithPresave(note, () => {
          note.content.text = this.updatePreviewText();
          note.content.preview_plain = this.truncateString(this.preview.textContent || this.preview.innerText);
          note.content.preview_html = null;
        });
      }
    });
  }

  addScrollListeners() {
    this.scrollHandlers.forEach(({ el, handler }) => el.addEventListener('scroll', handler));
  }

  removeScrollListeners() {
    this.scrollHandlers.forEach(({ el, handler }) => el.removeEventListener('scroll', handler));
  }

  scrollHandler = (source, destination) => {
    let frameRequested;

    return (event) => {
      // Avoid the cascading effect by not handling the event if it was triggered initially by this element
      if (this.scrollTriggers[source] === true) {
        this.scrollTriggers[source] = false;
        return;
      }
      this.scrollTriggers[source] = true;

      // Only request the animation frame once until it gets processed
      if (frameRequested) {
        return;
      }
      frameRequested = true;

      window.requestAnimationFrame(() => {
        let target = event.target;
        let height = target.scrollHeight - target.clientHeight;
        let ratio = parseFloat(target.scrollTop) / height;
        let move = (destination.scrollHeight - destination.clientHeight) * ratio;
        destination.scrollTop = move;

        frameRequested = false;
      });
    };
  }

  removeSelection() {
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    } else if (document.selection) {
      document.selection.empty();
    }
  }

  configureResizer() {
    let pressed = false;
    const columnResizer = document.getElementById('column-resizer');
    const resizerWidth = columnResizer.offsetWidth;
    const safetyOffset = 15;

    columnResizer.addEventListener('mousedown', () => {
      pressed = true;
      columnResizer.classList.add('dragging');
      this.editor.classList.add('no-selection');
    });

    document.addEventListener('mousemove', (event) => {
      if (!pressed) {
        return;
      }

      let x = event.clientX;
      if (x < resizerWidth / 2 + safetyOffset) {
        x = resizerWidth / 2 + safetyOffset;
      } else if (x > this.simpleMarkdown.offsetWidth - resizerWidth - safetyOffset) {
        x = this.simpleMarkdown.offsetWidth - resizerWidth - safetyOffset;
      }

      const colLeft = x - resizerWidth / 2;
      columnResizer.style.left = colLeft + 'px';
      this.editor.style.width = (colLeft - safetyOffset) + 'px';

      this.removeSelection();
    });

    document.addEventListener('mouseup', () => {
      if (pressed) {
        pressed = false;
        columnResizer.classList.remove('dragging');
        this.editor.classList.remove('no-selection');
      }
    });
  }

  addTabHandler() {
    // Tab handler
    this.editor.addEventListener('keydown', (event) => {
      if (!event.shiftKey && event.which == 9) {
        event.preventDefault();

        // Using document.execCommand gives us undo support
        if (!document.execCommand('insertText', false, '\t')) {
          // document.execCommand works great on Chrome/Safari but not Firefox
          const start = this.selectionStart;
          const end = this.selectionEnd;
          const spaces = '    ';

          // Insert 4 spaces
          this.value = this.value.substring(0, start)
            + spaces + this.value.substring(end);

          // Place cursor 4 spaces away from where
          // the tab key was pressed
          this.selectionStart = this.selectionEnd = start + 4;
        }
      }
    });
  }

  render() {
    return (
      <div id="simple-markdown" className={`sn-component ${this.state.platform}`}>
        <div id="header">
          <div className="segmented-buttons-container sk-segmented-buttons">
            <div className="buttons">
              {this.modes.map(mode =>
                <div key={mode} onClick={() => this.changeMode(mode)} className={`sk-button button ${this.state.mode == mode ? 'selected info' : 'sk-secondary-contrast'}`}>
                  <div className="sk-label">
                    {mode.label}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div id="editor-container" className={this.state.mode.css}>
          <textarea dir="auto" id="editor" spellCheck="true" className={this.state.mode.css}></textarea>
          <div id="column-resizer" className={this.state.mode.css}></div>
          <div id="preview" className={this.state.mode.css}></div>
        </div>
      </div>
    );
  }
}

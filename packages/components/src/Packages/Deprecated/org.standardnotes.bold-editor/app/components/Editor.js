import React from 'react';
import FilesafeEmbed from 'filesafe-embed';
import EditorKit from '@standardnotes/editor-kit';
import DOMPurify  from 'dompurify';
import { SKAlert } from 'sn-stylekit';

// Not used directly here, but required to be imported so that it is included
// in dist file.
// Note that filesafe-embed also imports filesafe-js, but conditionally, so
// it's not included in it's own dist files.
// eslint-disable-next-line no-unused-vars
import Filesafe from 'filesafe-js';

export default class Editor extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
    this.alert = null;
    this.renderNote = false;
    this.isNoteLocked = false;
  }

  componentDidMount() {
    this.configureEditorKit();
    this.configureEditor();
  }

  configureEditorKit() {
    // EditorKit is a wrapper on top of the component manager to make it
    // easier to build editors. As such, it very general and does not know
    // how the functions are implemented, just that they are needed. It is
    // up to the Bold Editor wrapper to implement these important functions.
    const delegate = {
      insertRawText: (rawText) => {
        this.redactor.insertion.insertHtml(rawText);
      },
      preprocessElement: (element) => {
        // Convert inserting element to format Redactor wants.
        // This will wrap img elements, for example, in a figure element.
        // We also want to persist attributes from the inserting element.
        const cleaned = this.redactor.cleaner.input(element.outerHTML);
        const newElement = $R.dom(cleaned).nodes[0];

        for (const attribute of element.attributes) {
          newElement.setAttribute(attribute.nodeName, attribute.nodeValue);
        }

        return newElement;
      },
      insertElement: (element, inVicinityOfElement, insertionType) => {
        // When inserting elements via dom manipulation, it doesnt update the
        // source code view. So when you insert this element, open the code
        // view, and close it, the element will be gone. The only way it works
        // is if we use the proper redactor.insertion API, but I haven't found
        // a good way to use that API for inserting text at a given position.
        // There is 'insertToOffset', but where offset is the index of the
        // plaintext, but I haven't found a way to map the adjacentTo element
        // to a plaintext offset. So for now this bug will persist.

        // insertionType can be either 'afterend' or 'child'

        if (inVicinityOfElement) {
          if (insertionType == 'afterend') {
            inVicinityOfElement.insertAdjacentElement('afterend', element);
          } else if (insertionType == 'child') {
            // inVicinityOfElement.appendChild(element) doesn't work for some
            // reason when inserting videos.
            inVicinityOfElement.after(element);
          }
        } else {
          this.redactor.insertion.insertHtml(element.outerHTML);
        }
      },
      getElementsBySelector: (selector) => {
        return this.redactor.editor.getElement().find(selector).nodes;
      },
      getCurrentLineText: () => {
        // Returns the text content of the node where the cursor currently is.
        // Typically a paragraph if no formatter, otherwise the closest
        // formatted element, or null if there is no text content.
        const node = this.redactor.selection.getCurrent();
        return node.textContent;
      },
      getPreviousLineText: () => {
        // Returns the text content of the previous node, unless there is no
        // previous node, in which case it returns the falsy value.
        const currentElement = this.redactor.selection.getElement();
        const previousSibling = currentElement.previousSibling;
        return previousSibling && previousSibling.textContent;
      },
      replaceText: ({ regex, replacement, previousLine }) => {
        const marker = this.redactor.marker.insert('start');
        let node;
        if (previousLine) {
          node = this.redactor.selection.getElement().previousSibling;
        } else {
          node = marker.previousSibling;
        }

        // If we're searching the previous line, previousSibling may sometimes
        // be null.
        if (!node) {
          return;
        }

        let nodeText = node.textContent;
        // Remove our match from this element by replacing with empty string.
        // We'll add in our actual replacement as a new element
        nodeText = nodeText.replace(/&nbsp;/, ' ');
        nodeText = nodeText.replace(regex, '').replace(/\s$/, '').trim();
        if (nodeText.length == 0) {
          node.remove();
        } else {
          node.textContent = nodeText;
        }

        this.redactor.insertion.insertHtml(replacement, 'start');
        this.redactor.selection.restoreMarkers();
      },
      clearUndoHistory: () => {
        // Called when switching notes to prevent history mixup.
        $R('#editor', 'module.buffer.clear');
      },
      onNoteValueChange: async (note) => {
        this.renderNote = await this.shouldRenderNote(note);
        this.isNoteLocked = this.getNoteLockState(note);

        document.getElementById('editor').setAttribute(
          'spellcheck',
          JSON.stringify(note.content.spellcheck)
        );

        this.scrollToTop();
      },
      setEditorRawText: (rawText) => {
        // Disabling read-only mode so that we can use source.setCode
        this.disableReadOnly();

        if (!this.renderNote) {
          $R('#editor', 'source.setCode', '');
          this.enableReadOnly();
          return;
        }

        // Called when the Bold Editor is loaded, when switching to a Bold
        // Editor note, or when uploading files, maybe in more places too.
        const cleaned = this.redactor.cleaner.input(rawText);
        $R('#editor', 'source.setCode', cleaned);

        if (this.isNoteLocked) {
          this.enableReadOnly();
        } else {
          this.disableReadOnly();
        }
      }
    };

    this.editorKit = new EditorKit(delegate, {
      mode: 'html',
      supportsFileSafe: true,
      // Redactor has its own debouncing, so we'll set ours to 0
      coallesedSavingDelay: 0
    });
  }

  async configureEditor() {
    // We need to set this as a window variable so that the filesafe plugin
    // can interact with this object passing it as an opt for some reason
    // strips any functions off the objects.
    const filesafeInstance = await this.editorKit.getFileSafe();
    window.filesafe_params = {
      embed: FilesafeEmbed,
      client: filesafeInstance
    };
    this.redactor = $R('#editor', {
      styles: true,
      toolbarFixed: true, // sticky toolbar
      tabAsSpaces: 2, // currently tab only works if you use spaces.
      tabKey: true, // explicitly set tabkey for editor use, not for focus.
      linkSize: 20000, // redactor default is 30, which truncates the link.
      buttonsAdd: ['filesafe'],
      buttons: [
        'bold', 'italic', 'underline', 'deleted', 'format', 'fontsize',
        'fontfamily', 'fontcolor', 'filesafe', 'link', 'lists', 'alignment',
        'line', 'redo', 'undo', 'indent', 'outdent', 'textdirection', 'html'
      ],
      plugins: [
        'filesafe', 'fontsize', 'fontfamily', 'fontcolor', 'alignment',
        'table', 'inlinestyle', 'textdirection'
      ],
      fontfamily: [
        'Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Trebuchet MS',
        'Monospace'
      ],
      callbacks: {
        changed: (html) => {
          if (this.isNoteLocked || this.redactor.isReadOnly() || !this.renderNote) {
            return;
          }
          // I think it's already cleaned so we don't need to do this.
          // let cleaned = this.redactor.cleaner.output(html);
          this.editorKit.onEditorValueChanged(html);
        },
        pasted: (_nodes) => {
          this.editorKit.onEditorPaste();
        },
        image: {
          resized: (image) => {
            // Underlying html will change, triggering save event.
            // New img dimensions need to be copied over to figure element.
            const img = image.nodes[0];
            const fig = img.parentNode;
            fig.setAttribute('width', img.getAttribute('width'));
            fig.setAttribute('height', img.getAttribute('height'));
          }
        }
      },
      imageEditable: false,
      imageCaption: false,
      imageLink: false,
      imageResizable: true, // requires image to be wrapped in a figure.
      imageUpload: (formData, files, _event) => {
        // Called when images are pasted from the clipboard too.
        this.onEditorFilesDrop(files);
      }
    });

    this.redactor.editor.getElement().on('keyup.textsearcher', (event) => {
      const key = event.which;
      this.editorKit.onEditorKeyUp({
        key,
        isSpace: key == this.redactor.keycodes.SPACE,
        isEnter: key == this.redactor.keycodes.ENTER
      });
    });

    // "Set the focus to the editor layer to the end of the content."
    // Doesn't work because setEditorRawText is called when loading a note and
    // it doesn't save the caret location, so focuses to beginning.
    if (!this.redactor.editor.isEmpty()) {
      this.redactor.editor.endFocus();
    }
  }

  onEditorFilesDrop(files) {
    if (!this.editorKit.canUseFileSafe()) {
      return;
    }

    if (!this.editorKit.canUploadFiles()) {
      // Open filesafe modal
      this.redactor.plugin.filesafe.open();
      return;
    }

    for (const file of files) {
      // Observers in EditorKitInternal.js will handle successful upload
      this.editorKit.uploadJSFileObject(file).then((descriptor) => {
        if (!descriptor || !descriptor.uuid) {
          // alert("File failed to upload. Please try again");
        }
      });
    }
  }

  /**
   * Checks if HTML is safe to render.
   */
  checkIfUnsafeContent(renderedHtml) {
    const sanitizedHtml = DOMPurify.sanitize(renderedHtml, {
      /**
       * We don't need script or style tags.
       */
      FORBID_TAGS: ['script', 'style'],
      /**
       * XSS payloads can be injected via these attributes.
       */
      FORBID_ATTR: [
        'onerror',
        'onload',
        'onunload',
        'onclick',
        'ondblclick',
        'onmousedown',
        'onmouseup',
        'onmouseover',
        'onmousemove',
        'onmouseout',
        'onfocus',
        'onblur',
        'onkeypress',
        'onkeydown',
        'onkeyup',
        'onsubmit',
        'onreset',
        'onselect',
        'onchange'
      ]
    });

    /**
     * Create documents from both the sanitized string and the rendered string.
     * This will allow us to compare them, and if they are not equal
     * (i.e: do not contain the same properties, attributes, inner text, etc)
     * it means something was stripped.
     */
    const renderedDom = new DOMParser().parseFromString(renderedHtml, 'text/html');
    const sanitizedDom = new DOMParser().parseFromString(sanitizedHtml, 'text/html');
    return !renderedDom.isEqualNode(sanitizedDom);
  }

  async showUnsafeContentAlert() {
    const text = 'We’ve detected that this note contains a script or code snippet which may be unsafe to execute. ' +
                  'Scripts executed in the editor have the ability to impersonate as the editor to Standard Notes. ' +
                  'Press Continue to mark this script as safe and proceed, or Cancel to avoid rendering this note.';

    return new Promise((resolve) => {
      this.alert = new SKAlert({
        title: null,
        text,
        buttons: [
          {
            text: 'Cancel',
            style: 'neutral',
            action: function() {
              resolve(false);
            },
          },
          {
            text: 'Continue',
            style: 'danger',
            action: function() {
              resolve(true);
            },
          },
        ]
      });
      this.alert.present();
    });
  }

  setTrustUnsafeContent(note) {
    this.editorKit.saveItemWithPresave(note, () => {
      note.clientData = {
        ...note.clientData,
        trustUnsafeContent: true
      };
    });
  }

  enableReadOnly() {
    if (this.redactor.isReadOnly()) {
      return;
    }
    $R('#editor', 'enableReadOnly');
  }

  disableReadOnly() {
    if (!this.redactor.isReadOnly()) {
      return;
    }
    $R('#editor', 'disableReadOnly');
  }

  scrollToTop() {
    window.scroll(0, 0);
  }

  async shouldRenderNote(noteItem) {
    this.dismissUnsafeContentAlerts();

    const isUnsafeContent = this.checkIfUnsafeContent(noteItem.content.text);
    const trustUnsafeContent = noteItem.clientData['trustUnsafeContent'] ?? false;

    if (!isUnsafeContent) {
      return true;
    }

    if (isUnsafeContent && trustUnsafeContent) {
      return true;
    }

    const result = await this.showUnsafeContentAlert();
    if (result) {
      this.setTrustUnsafeContent(noteItem);
    }

    return result;
  }

  dismissUnsafeContentAlerts() {
    try {
      if (this.alert) {
        this.alert.dismiss();
      }
      this.alert = null;
    } catch (e) {
      console.warn('Trying to dismiss an alert that does not exist anymore.');
    }
  }

  getNoteLockState(note) {
    return note.content.appData['org.standardnotes.sn']['locked'] ?? false;
  }

  render() {
    return (
      <div key="editor" className={'sn-component'} />
    );
  }
}

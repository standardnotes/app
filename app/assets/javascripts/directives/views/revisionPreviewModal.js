import { 
  PAYLOAD_SOURCE_REMOTE_ACTION_RETRIEVED, 
  ContentTypes
} from 'snjs';
import template from '%/directives/revision-preview-modal.pug';

class RevisionPreviewModalCtrl {
  /* @ngInject */
  constructor(
    $element,
    $scope,
    $timeout,
    application
  ) {
    this.$element = $element;
    this.$scope = $scope;
    this.$timeout = $timeout;
    this.application = application;
    this.configure();
    $scope.$on('$destroy', () => {
      if (this.identifier) {
        this.application.componentManager.deregisterHandler(this.identifier);
      }
    });
  }
  
  async configure() {
    this.note = await this.application.createItem({
      contentType: ContentTypes.Note,
      content: this.content
    });

    /**
     * Set UUID so editoForNote can find proper editor, but then generate new uuid 
     * for note as not to save changes to original, if editor makes changes.
     */
    this.note.uuid = this.uuid;
    const editorForNote = this.application.componentManager.editorForNote(this.note);
    this.note.uuid = await this.application.generateUuid();
    if (editorForNote) {
      /** 
       * Create temporary copy, as a lot of componentManager is uuid based, so might 
       * interfere with active editor. Be sure to copy only the content, as the top level 
       * editor object has non-copyable properties like .window, which cannot be transfered
       */
      const editorCopy = await this.application.createItem({ 
        contentType: ContentTypes.Component,
        content: editorForNote.content
      });
      editorCopy.readonly = true;
      editorCopy.lockReadonly = true;
      this.identifier = editorCopy.uuid;
      this.application.componentManager.registerHandler({
        identifier: this.identifier,
        areas: ['editor-editor'],
        contextRequestHandler: (component) => {
          if (component === this.editor) {
            return this.note;
          }
        },
        componentForSessionKeyHandler: (key) => {
          if (key === this.editor.sessionKey) {
            return this.editor;
          }
        }
      });

      this.editor = editorCopy;
    }
  }

  restore(asCopy) {
    const run = async () => {
      let item;
      if (asCopy) {
        const contentCopy = Object.assign({}, this.content);
        if (contentCopy.title) {
          contentCopy.title += " (copy)";
        }
        item = await this.application.createItem({
          contentType: 'Note',
          content: contentCopy,
          needsSync: true
        });
      } else {
        const uuid = this.uuid;
        item = this.application.findItem({uuid: uuid});
        item.content = Object.assign({}, this.content);
        await this.application.mergeItem({
          item: item,
          source: PAYLOAD_SOURCE_REMOTE_ACTION_RETRIEVED
        });
      }
      this.application.saveItem({item});
      this.dismiss();
    };

    if (!asCopy) {
      this.application.alertManager.confirm({
        text: "Are you sure you want to replace the current note's contents with what you see in this preview?",
        destructive: true,
        onConfirm: run
      });
    } else {
      run();
    }
  }

  dismiss() {
    this.$element.remove();
    this.$scope.$destroy();
  }
}

export class RevisionPreviewModal {
  constructor() {
    this.restrict = 'E';
    this.template = template;
    this.controller = RevisionPreviewModalCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {
      uuid: '=',
      content: '='
    };
  }
}

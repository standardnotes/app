import { protocolManager, SNComponent, SFItem, SFModelManager } from 'snjs';
import template from '%/directives/revision-preview-modal.pug';

class RevisionPreviewModalCtrl {
  /* @ngInject */
  constructor(
    $element,
    $scope,
    $timeout,
    alertManager,
    componentManager,
    modelManager,
    syncManager,
  ) {
    this.$element = $element;
    this.$scope = $scope;
    this.$timeout = $timeout;
    this.alertManager = alertManager;
    this.componentManager = componentManager;
    this.modelManager = modelManager;
    this.syncManager = syncManager;
    this.createNote();
    this.configureEditor();
    $scope.$on('$destroy', () => {
      if (this.identifier) {
        this.componentManager.deregisterHandler(this.identifier);
      }
    });
  }

  createNote() {
    this.note = new SFItem({
      content: this.content,
      content_type: "Note"
    });
  }

  configureEditor() {
    /**
     * Set UUID so editoForNote can find proper editor, but then generate new uuid 
     * for note as not to save changes to original, if editor makes changes.
     */
    this.note.uuid = this.uuid;
    const editorForNote = this.componentManager.editorForNote(this.note);
    this.note.uuid = protocolManager.crypto.generateUUIDSync();
    if (editorForNote) {
      /** 
       * Create temporary copy, as a lot of componentManager is uuid based, so might 
       * interfere with active editor. Be sure to copy only the content, as the top level 
       * editor object has non-copyable properties like .window, which cannot be transfered
       */
      const editorCopy = new SNComponent({ 
        content: editorForNote.content
      });
      editorCopy.readonly = true;
      editorCopy.lockReadonly = true;
      this.identifier = editorCopy.uuid;
      this.componentManager.registerHandler({
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
    const run = () => {
      let item;
      if (asCopy) {
        const contentCopy = Object.assign({}, this.content);
        if (contentCopy.title) {
          contentCopy.title += " (copy)";
        }
        item = this.modelManager.createItem({
          content_type: 'Note',
          content: contentCopy
        });
        this.modelManager.addItem(item);
      } else {
        const uuid = this.uuid;
        item = this.modelManager.findItem(uuid);
        item.content = Object.assign({}, this.content);
        this.modelManager.mapResponseItemsToLocalModels(
          [item],
          SFModelManager.MappingSourceRemoteActionRetrieved
        );
      }
      this.modelManager.setItemDirty(item);
      this.syncManager.sync();
      this.dismiss();
    };

    if (!asCopy) {
      this.alertManager.confirm({
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

import { cryptoManager, SNComponent, SFItem, SFModelManager } from 'snjs';
import template from '%/directives/revision-preview-modal.pug';

export class RevisionPreviewModal {
  constructor() {
    this.restrict = 'E';
    this.template = template;
    this.scope = {
      uuid: '=',
      content: '='
    };
  }

  link($scope, el, attrs) {
    $scope.el = el;
  }

  /* @ngInject */
  controller($scope, modelManager, syncManager, componentManager, $timeout, alertManager) {
    $scope.dismiss = function() {
      $scope.el.remove();
      $scope.$destroy();
    }

    $scope.$on("$destroy", function() {
      if($scope.identifier) {
        componentManager.deregisterHandler($scope.identifier);
      }
    });

    $scope.note = new SFItem({content: $scope.content, content_type: "Note"});
    // Set UUID to editoForNote can find proper editor,
    // but then generate new uuid for note as not to save changes to original, if editor makes changes.
    $scope.note.uuid = $scope.uuid;
    let editorForNote = componentManager.editorForNote($scope.note);
    $scope.note.uuid = cryptoManager.crypto.generateUUIDSync();

    if(editorForNote) {
      // Create temporary copy, as a lot of componentManager is uuid based,
      // so might interfere with active editor. Be sure to copy only the content, as the
      // top level editor object has non-copyable properties like .window, which cannot be transfered
      let editorCopy = new SNComponent({content: editorForNote.content});
      editorCopy.readonly = true;
      editorCopy.lockReadonly = true;
      $scope.identifier = editorCopy.uuid;

      componentManager.registerHandler({identifier: $scope.identifier, areas: ["editor-editor"],
        contextRequestHandler: (component) => {
          if(component == $scope.editor) {
            return $scope.note;
          }
        },
        componentForSessionKeyHandler: (key) => {
          if(key == $scope.editor.sessionKey) {
            return $scope.editor;
          }
        }
      });

      $scope.editor = editorCopy;
    }

    $scope.restore = function(asCopy) {
      const run = () => {
        let item;
        if(asCopy) {
          let contentCopy = Object.assign({}, $scope.content);
          if(contentCopy.title) { contentCopy.title += " (copy)"; }
          item = modelManager.createItem({content_type: "Note", content: contentCopy});
          modelManager.addItem(item);
        } else {
          let uuid = $scope.uuid;
          item = modelManager.findItem(uuid);
          item.content = Object.assign({}, $scope.content);
          // mapResponseItemsToLocalModels is async, but we don't need to wait here.
          modelManager.mapResponseItemsToLocalModels([item], SFModelManager.MappingSourceRemoteActionRetrieved);
        }

        modelManager.setItemDirty(item, true);
        syncManager.sync();
        $scope.dismiss();
      }

      if(!asCopy) {
        alertManager.confirm({text: "Are you sure you want to replace the current note's contents with what you see in this preview?", destructive: true, onConfirm: () => {
          run();
        }})
      } else {
        run();
      }
    }
  }
}

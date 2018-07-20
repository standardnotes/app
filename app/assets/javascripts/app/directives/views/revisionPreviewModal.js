class RevisionPreviewModal {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "directives/revision-preview-modal.html";
    this.scope = {
      uuid: "=",
      content: "="
    };
  }

  link($scope, el, attrs) {

    $scope.dismiss = function() {
      el.remove();
    }
  }

  controller($scope, modelManager, syncManager) {
    'ngInject';

    $scope.restore = function(asCopy) {
      if(!asCopy && !confirm("Are you sure you want to replace the current note's contents with what you see in this preview?")) {
        return;
      }

      var item;
      if(asCopy) {
        var contentCopy = Object.assign({}, $scope.content);
        if(contentCopy.title) { contentCopy.title += " (copy)"; }
        item = modelManager.createItem({content_type: "Note", content: contentCopy});
        modelManager.addItem(item);
      } else {
        var uuid = $scope.uuid;
        item = modelManager.findItem(uuid);
        item.content = Object.assign({}, $scope.content);
        modelManager.mapResponseItemsToLocalModels([item], SFModelManager.MappingSourceRemoteActionRetrieved);
      }

      item.setDirty(true);
      syncManager.sync();

      $scope.dismiss();
    }
  }
}

angular.module('app').directive('revisionPreviewModal', () => new RevisionPreviewModal);

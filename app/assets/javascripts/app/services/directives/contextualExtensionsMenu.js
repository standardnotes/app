class ContextualExtensionsMenu {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/contextual-menu.html";
    this.scope = {
      item: "="
    };
  }

  controller($scope, modelManager, extensionManager) {
    'ngInject';

    $scope.extensions = _.map(extensionManager.extensionsInContextOfItem($scope.item), function(ext){
      return _.cloneDeep(ext);
    });

    for(let ext of $scope.extensions) {
      ext.loading = true;
      extensionManager.loadExtensionInContextOfItem(ext, $scope.item, function(scopedExtension) {
        ext.loading = false;
        if(scopedExtension) {
          _.merge(ext, scopedExtension);
          ext.actions = scopedExtension.actions;
        }
      })
    }

    $scope.executeAction = function(action, extension) {
      action.running = true;
      extensionManager.executeAction(action, extension, $scope.item, function(response){
        action.running = false;
      })
    }

    $scope.accessTypeForExtension = function(extension) {
      return extensionManager.extensionUsesEncryptedData(extension) ? "encrypted" : "decrypted";
    }
  }

}

angular.module('app.frontend').directive('contextualExtensionsMenu', () => new ContextualExtensionsMenu);

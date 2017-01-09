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
    $scope.extensions = extensionManager.extensionsInContextOfItem($scope.item);

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

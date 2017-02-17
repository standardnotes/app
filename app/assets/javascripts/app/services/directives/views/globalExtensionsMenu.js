class GlobalExtensionsMenu {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/global-extensions-menu.html";
    this.scope = {
    };
  }

  controller($scope, extensionManager, syncManager) {
    'ngInject';

    $scope.extensionManager = extensionManager;

    $scope.toggleExtensionForm = function() {
      $scope.newExtensionData = {};
      $scope.showNewExtensionForm = !$scope.showNewExtensionForm;
    }

    $scope.submitNewExtensionForm = function() {
      if($scope.newExtensionData.url) {
        extensionManager.addExtension($scope.newExtensionData.url, function(response){
          if(!response) {
            if($scope.newExtensionData.url.indexOf("name=") != -1) {
              // user is mistakenly trying to register editor extension, most likely
              alert("Unable to register this extension. It looks like you may be trying to install an editor extension. To do that, click 'Editor' under the current note's title.");
            } else {
              alert("Unable to register this extension. Make sure the link is valid and try again.");
            }
          } else {
            $scope.newExtensionData.url = "";
            $scope.showNewExtensionForm = false;
          }
        })
      }
    }

    $scope.selectedAction = function(action, extension) {
      extensionManager.executeAction(action, extension, null, function(response){
        if(response && response.error) {
          action.error = true;
          alert("There was an error performing this action. Please try again.");
        } else {
          action.error = false;
          syncManager.sync(null);
        }
      })
    }

    $scope.changeExtensionEncryptionFormat = function(encrypted, extension) {
      extensionManager.changeExtensionEncryptionFormat(encrypted, extension);
    }

    $scope.deleteExtension = function(extension) {
      if(confirm("Are you sure you want to delete this extension?")) {
        extensionManager.deleteExtension(extension);
      }
    }

    $scope.reloadExtensionsPressed = function() {
      if(confirm("For your security, reloading extensions will disable any currently enabled repeat actions.")) {
        extensionManager.refreshExtensionsFromServer();
      }
    }
  }

}

angular.module('app.frontend').directive('globalExtensionsMenu', () => new GlobalExtensionsMenu);

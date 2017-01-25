class GlobalExtensionsMenu {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/global-extensions-menu.html";
    this.scope = {
    };
  }

  controller($scope, apiController, extensionManager) {
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
            alert("Unable to register this extension. Make sure the link is valid and try again.");
          } else {
            $scope.newExtensionData.url = "";
            $scope.showNewExtensionForm = false;
          }
        })
      }
    }

    $scope.selectedAction = function(action, extension) {
      action.running = true;
      extensionManager.executeAction(action, extension, null, function(response){
        action.running = false;
        if(response && response.error) {
          action.error = true;
          alert("There was an error performing this action. Please try again.");
        } else {
          action.error = false;
          apiController.sync(null);
        }
      })
    }

    $scope.changeExtensionEncryptionFormat = function(encrypted, extension) {
      var provider = $scope.syncProviderForExtension(extension);
      if(provider) {
        if(confirm("Changing encryption status will update all your items and re-sync them back to the server. This can take several minutes. Are you sure you want to continue?")) {
          extensionManager.changeExtensionEncryptionFormat(encrypted, extension);
          apiController.resyncAllDataForProvider(provider);
        } else {
          // revert setting
          console.log("reverting");
          extension.encrypted = extensionManager.extensionUsesEncryptedData(extension);
        }
      } else {
        extensionManager.changeExtensionEncryptionFormat(encrypted, extension);
      }
    }

    $scope.deleteExtension = function(extension) {
      if(confirm("Are you sure you want to delete this extension?")) {
        extensionManager.deleteExtension(extension);
        var syncProviderAction = extension.syncProviderAction;
        if(syncProviderAction) {
          apiController.removeSyncProvider(apiController.syncProviderForURL(syncProviderAction.url));
        }
      }
    }

    $scope.reloadExtensionsPressed = function() {
      if(confirm("For your security, reloading extensions will disable any currently enabled sync providers and repeat actions.")) {
        extensionManager.refreshExtensionsFromServer();
        var syncProviderAction = extension.syncProviderAction;
        if(syncProviderAction) {
          apiController.removeSyncProvider(apiController.syncProviderForURL(syncProviderAction.url));
        }
      }
    }

    $scope.setEncryptionKeyForExtension = function(extension) {
      extension.formData.changingKey = false;
      var ek = extension.formData.ek;
      extensionManager.setEkForExtension(extension, ek);
      if(extension.formData.changingKey) {
        var syncAction = extension.syncProviderAction;
        if(syncAction) {
          var provider = apiController.syncProviderForURL(syncAction.url);
          provider.ek = ek;
          apiController.didMakeChangesToSyncProviders();
          apiController.resyncAllDataForProvider(provider);
        }
      }
    }

    $scope.changeEncryptionKeyPressed = function(extension) {
      if(!confirm("Changing your encryption key will re-encrypt all your notes with the new key and sync them back to the server. This can take several minutes. We strongly recommend downloading a backup of your notes before continuing.")) {
        return;
      }

      extension.formData.changingKey = true;
    }
  }

}

angular.module('app.frontend').directive('globalExtensionsMenu', () => new GlobalExtensionsMenu);

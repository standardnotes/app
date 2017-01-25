class AccountSyncSection {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/account-sync-section.html";
    this.scope = {
    };
  }

  controller($scope, apiController, modelManager, keyManager) {
    'ngInject';

      $scope.syncProviders = apiController.syncProviders;
      $scope.newSyncData = {showAddSyncForm: false}
      $scope.keys = keyManager.keys;

      $scope.submitExternalSyncURL = function() {
        apiController.addSyncProviderFromURL($scope.newSyncData.url);
        $scope.newSyncData.showAddSyncForm = false;
      }

      $scope.enableSyncProvider = function(provider, primary) {
        if(!provider.keyName) {
          alert("You must choose an encryption key for this provider before enabling it.");
          return;
        }
        apiController.enableSyncProvider(provider, primary);
      }

      $scope.removeSyncProvider = function(provider) {
        apiController.removeSyncProvider(provider);
      }
  }
}

angular.module('app.frontend').directive('accountSyncSection', () => new AccountSyncSection);

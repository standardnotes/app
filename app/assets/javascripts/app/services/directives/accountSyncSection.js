class AccountSyncSection {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/account-menu/account-sync-section.html";
    this.scope = {
    };
  }

  controller($scope, modelManager, keyManager, syncManager) {
    'ngInject';

      $scope.syncManager = syncManager;
      $scope.syncProviders = syncManager.syncProviders;
      $scope.keys = keyManager.keys;
      // $scope.showSection = syncManager.syncProviders.length > 0;

      $scope.enableSyncProvider = function(provider, primary) {
        if(!provider.keyName) {
          alert("You must choose an encryption key for this account before enabling it.");
          return;
        }

        syncManager.enableSyncProvider(provider, primary);
      }

      $scope.removeSyncProvider = function(provider) {
        if(provider.primary) {
          alert("You cannot remove your main sync account. Instead, end your session by destroying all local data. Or, choose another account to be your primary sync account.")
          return;
        }

        if(confirm("Are you sure you want to remove this sync account?")) {
          syncManager.removeSyncProvider(provider);
        }
      }

      $scope.changeEncryptionKey = function(provider) {
        if(provider.isStandardNotesAccount) {
          alert("To change your encryption key for your Standard File account, you need to change your password. However, this functionality is not currently available.");
          return;
        }

        if(!confirm("Changing your encryption key will re-encrypt all your notes with the new key and sync them back to the server. This can take several minutes. We strongly recommend downloading a backup of your notes before continuing.")) {
          return;
        }

        provider.formData = {keyName: provider.keyName};
        provider.showKeyForm = true;
      }

      $scope.saveKey = function(provider) {
        provider.showKeyForm = false;
        provider.keyName = provider.formData.keyName;
        syncManager.didMakeChangesToSyncProviders();

        if(provider.enabled) {
          syncManager.addAllDataAsNeedingSyncForProvider(provider);
          syncManager.sync();
        }
      }
  }
}

angular.module('app.frontend').directive('accountSyncSection', () => new AccountSyncSection);

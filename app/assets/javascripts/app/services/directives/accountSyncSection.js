class AccountSyncSection {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/account-sync-section.html";
    this.scope = {
    };
  }

  controller($scope, modelManager, keyManager, syncManager) {
    'ngInject';

      $scope.syncProviders = syncManager.syncProviders;
      $scope.newSyncData = {showAddSyncForm: false}
      $scope.keys = keyManager.keys;

      $scope.submitExternalSyncURL = function() {
        syncManager.addSyncProviderFromURL($scope.newSyncData.url);
        $scope.newSyncData.showAddSyncForm = false;
      }

      $scope.enableSyncProvider = function(provider, primary) {
        if(!provider.keyName) {
          alert("You must choose an encryption key for this provider before enabling it.");
          return;
        }

        syncManager.enableSyncProvider(provider, primary);
        syncManager.addAllDataAsNeedingSyncForProvider(provider);
        syncManager.sync();
      }

      $scope.removeSyncProvider = function(provider) {
        if(provider.isStandardNotesAccount) {
          alert("To remove your Standard Notes sync, sign out of your Standard Notes account.")
          return;
        }

        if(confirm("Are you sure you want to remove this sync provider?")) {
          syncManager.removeSyncProvider(provider);
        }
      }

      $scope.changeEncryptionKey = function(provider) {
        if(provider.isStandardNotesAccount) {
          alert("To change your encryption key for your Standard Notes account, you need to change your password. However, this functionality is not currently supported.");
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

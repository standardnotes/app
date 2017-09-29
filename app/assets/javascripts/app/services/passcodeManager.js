angular.module('app.frontend')
  .provider('passcodeManager', function () {

    this.$get = function($rootScope, $timeout, modelManager, dbManager, authManager, storageManager) {
        return new PasscodeManager($rootScope, $timeout, modelManager, dbManager, authManager, storageManager);
    }

    function PasscodeManager($rootScope, $timeout, modelManager, dbManager, authManager, storageManager) {

      this._locked = storageManager.getItem("offlineParams") != null;

      this.isLocked = function() {
        return this._locked;
      }

      this.unlock = function(passcode, callback) {
        var params = JSON.parse(storageManager.getItem("offlineParams"), StorageManager.Fixed);
        Neeto.crypto.computeEncryptionKeysForUser(_.merge({password: passcode}, params), function(keys){
          if(keys.pw !== params.hash) {
            callback(false);
            return;
          }

          this.decryptLocalStorage(keys);
          callback(true);
        }.bind(this));
      }

      this.setPasscode = function(passcode, callback) {
        var cost = Neeto.crypto.defaultPasswordGenerationCost();
        var salt = Neeto.crypto.generateRandomKey(512);
        var defaultParams = {pw_cost: cost, pw_salt: salt};

        Neeto.crypto.computeEncryptionKeysForUser(_.merge({password: passcode}, defaultParams), function(keys) {
          defaultParams.hash = keys.pw;
          storageManager.setItem("offlineParams", JSON.stringify(defaultParams), StorageManager.Fixed);
          this.encryptLocalStorage(keys);
          callback(true);
        }.bind(this));
      }


      this.encryptLocalStorage = function(keys) {
        var passcodeItem = new OfflinePasscode();
        var storage = {};
        var storageKeys = authManager.getLocalStorageKeys();
        for(var key of storageKeys) {
          storage[key] = storageManager.getItem(key);
          storageManager.removeItem(key);
        }

        StorageManager.setMode(StorageManager.Ephemeral);

        passcodeItem.storage = storage;
        var params = new ItemParams(passcodeItem, keys);
        storageManager.setItem("encryptedStorage", JSON.stringify(params.paramsForSync()), StorageManager.Fixed);
      }

      this.decryptLocalStorage = function(keys) {
        var stored = JSON.parse(storageManager.getItem("encryptedStorage"), StorageManager.Fixed);
        EncryptionHelper.decryptItem(stored, keys);
        var passcodeItem = new OfflinePasscode(stored);

        var storageKeys = authManager.getLocalStorageKeys();
        for(var key of storageKeys) {
          storageManager.setItem(key, passcodeItem.storage[key]);
        }
      }


     }
});

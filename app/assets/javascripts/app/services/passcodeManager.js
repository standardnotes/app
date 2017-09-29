angular.module('app.frontend')
  .provider('passcodeManager', function () {

    this.$get = function($rootScope, $timeout, modelManager, dbManager, authManager, storageManager) {
        return new PasscodeManager($rootScope, $timeout, modelManager, dbManager, authManager, storageManager);
    }

    function PasscodeManager($rootScope, $timeout, modelManager, dbManager, authManager, storageManager) {

      this._hasPasscode = storageManager.getItem("offlineParams", StorageManager.Fixed) != null;
      this._locked = this._hasPasscode;

      this.isLocked = function() {
        return this._locked;
      }

      this.hasPasscode = function() {
        return this._hasPasscode;
      }

      this.keys = function() {
        return this._keys;
      }

      this.unlock = function(passcode, callback) {
        var params = JSON.parse(storageManager.getItem("offlineParams", StorageManager.Fixed));
        Neeto.crypto.computeEncryptionKeysForUser(_.merge({password: passcode}, params), function(keys){
          if(keys.pw !== params.hash) {
            callback(false);
            return;
          }

          this._keys = keys;
          this.decryptLocalStorage(keys);
          this._locked = false;
          callback(true);
        }.bind(this));
      }

      this.setPasscode = function(passcode, callback) {
        var cost = Neeto.crypto.defaultPasswordGenerationCost();
        var salt = Neeto.crypto.generateRandomKey(512);
        var defaultParams = {pw_cost: cost, pw_salt: salt};

        Neeto.crypto.computeEncryptionKeysForUser(_.merge({password: passcode}, defaultParams), function(keys) {
          defaultParams.hash = keys.pw;
          this._keys = keys;
          this._hasPasscode = true;

          // Encrypting will initially clear localStorage
          this.encryptLocalStorage(keys);

          // After it's cleared, it's safe to write to it
          storageManager.setItem("offlineParams", JSON.stringify(defaultParams), StorageManager.Fixed);
          callback(true);
        }.bind(this));
      }

      this.clearPasscode = function() {
        storageManager.setItemsMode(StorageManager.Fixed); // Transfer from Ephemeral
        storageManager.removeItem("offlineParams", StorageManager.Fixed);
        storageManager.removeItem("encryptedStorage", StorageManager.Fixed);
        this._keys = null;
        this._hasPasscode = false;
      }


      this.encryptLocalStorage = function(keys) {
        var passcodeItem = new OfflinePasscode();
        var storage = {};
        var storageKeys = authManager.getLocalStorageKeys();
        for(var key of storageKeys) {
          storage[key] = storageManager.getItem(key);
          storageManager.removeItem(key);
        }

        storageManager.setItemsMode(StorageManager.Ephemeral);

        passcodeItem.storage = storage;
        var params = new ItemParams(passcodeItem, keys);
        storageManager.setItem("encryptedStorage", JSON.stringify(params.paramsForSync()), StorageManager.Fixed);
      }

      this.decryptLocalStorage = function(keys) {
        var stored = JSON.parse(storageManager.getItem("encryptedStorage", StorageManager.Fixed));
        EncryptionHelper.decryptItem(stored, keys);
        var passcodeItem = new OfflinePasscode(stored);

        var storageKeys = authManager.getLocalStorageKeys();
        for(var key of storageKeys) {
          storageManager.setItem(key, passcodeItem.storage[key]);
        }
      }


     }
});

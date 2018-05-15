angular.module('app')
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

      this.passcodeAuthParams = function() {
        return JSON.parse(storageManager.getItem("offlineParams", StorageManager.Fixed));
      }

      this.unlock = function(passcode, callback) {
        var params = this.passcodeAuthParams();
        SFJS.crypto.computeEncryptionKeysForUser(passcode, params, (keys) => {
          if(keys.pw !== params.hash) {
            callback(false);
            return;
          }

          this._keys = keys;
          this.decryptLocalStorage(keys);
          this._locked = false;
          callback(true);
        });
      }

      this.setPasscode = (passcode, callback) => {
        var uuid = SFJS.crypto.generateUUID();

        SFJS.crypto.generateInitialEncryptionKeysForUser(uuid, passcode, (keys, authParams) => {
          authParams.hash = keys.pw;
          this._keys = keys;
          this._hasPasscode = true;

          // Encrypting will initially clear localStorage
          this.encryptLocalStorage(keys, authParams);

          // After it's cleared, it's safe to write to it
          storageManager.setItem("offlineParams", JSON.stringify(authParams), StorageManager.Fixed);
          callback(true);
        });
      }

      this.changePasscode = (newPasscode, callback) => {
        this.setPasscode(newPasscode, callback);
      }

      this.clearPasscode = function() {
        storageManager.setItemsMode(authManager.isEphemeralSession() ? StorageManager.Ephemeral : StorageManager.Fixed); // Transfer from Ephemeral
        storageManager.removeItem("offlineParams", StorageManager.Fixed);
        this._keys = null;
        this._hasPasscode = false;
      }

      this.encryptLocalStorage = function(keys, authParams) {
        storageManager.setKeys(keys);
        // Switch to Ephemeral storage, wiping Fixed storage
        // Last argument is `force`, which we set to true because in the case of changing passcode
        storageManager.setItemsMode(authManager.isEphemeralSession() ? StorageManager.Ephemeral : StorageManager.FixedEncrypted, true);
      }

      this.decryptLocalStorage = function(keys) {
        storageManager.setKeys(keys);
        storageManager.decryptStorage();
      }
    }
});

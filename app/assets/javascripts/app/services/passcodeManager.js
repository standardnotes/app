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
        var defaultParams = {pw_cost: cost, pw_salt: salt, version: "002"};

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
        storageManager.setItemsMode(authManager.isEphemeralSession() ? StorageManager.Ephemeral : StorageManager.Fixed); // Transfer from Ephemeral
        storageManager.removeItem("offlineParams", StorageManager.Fixed);
        this._keys = null;
        this._hasPasscode = false;
      }

      this.encryptLocalStorage = function(keys) {
        storageManager.setKeys(keys);
        // Switch to Ephemeral storage, wiping Fixed storage
        storageManager.setItemsMode(authManager.isEphemeralSession() ? StorageManager.Ephemeral : StorageManager.FixedEncrypted);
      }

      this.decryptLocalStorage = function(keys) {
        storageManager.setKeys(keys);
        storageManager.decryptStorage();
      }
    }
});

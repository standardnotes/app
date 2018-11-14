class PasscodeManager {

    constructor(authManager, storageManager) {
      document.addEventListener('visibilitychange', (e) => {
        console.log("visibilitychange", e, document.visibilityState);
        this.documentVisibilityChanged(document.visibilityState);
      });

      this.authManager = authManager;
      this.storageManager = storageManager;

      this._hasPasscode = this.storageManager.getItemSync("offlineParams", StorageManager.Fixed) != null;
      this._locked = this._hasPasscode;

      const MillisecondsPerSecond = 1000;
      PasscodeManager.AutoLockIntervalNone = 0;
      PasscodeManager.AutoLockIntervalFiveSecs = 5 * MillisecondsPerSecond;
      PasscodeManager.AutoLockIntervalOneMinute = 60 * MillisecondsPerSecond;
      PasscodeManager.AutoLockIntervalFiveMinutes = 300 * MillisecondsPerSecond;
      PasscodeManager.AutoLockIntervalOneHour = 3600 * MillisecondsPerSecond;

      PasscodeManager.AutoLockIntervalKey = "AutoLockIntervalKey";
    }

    getAutoLockIntervalOptions() {
      return [
        {
          value: PasscodeManager.AutoLockIntervalNone,
          label: "None"
        },
        {
          value: PasscodeManager.AutoLockIntervalFiveSecs,
          label: "5 Secs"
        },
        {
          value: PasscodeManager.AutoLockIntervalOneMinute,
          label: "1 Min"
        },
        {
          value: PasscodeManager.AutoLockIntervalFiveMinutes,
          label: "5 Min"
        },
        {
          value: PasscodeManager.AutoLockIntervalOneHour,
          label: "1 Hr"
        }
      ]
    }

    documentVisibilityChanged(visbility) {
      let visible = document.visibilityState == "visible";
      if(!visible) {
        this.beginAutoLockTimer();
      } else {
        this.cancelAutoLockTimer();
      }
    }

    async beginAutoLockTimer() {
      var interval = await this.getAutoLockInterval();
      if(interval == PasscodeManager.AutoLockIntervalNone) {
        return;
      }

      this.lockTimeout = setTimeout(() => {
        this.lockApplication();
      }, interval);
    }

    cancelAutoLockTimer() {
      clearTimeout(this.lockTimeout);
    }

    lockApplication() {
      window.location.reload();
      this.cancelAutoLockTimer();
    }

    isLocked() {
      return this._locked;
    }

    hasPasscode() {
      return this._hasPasscode;
    }

    keys() {
      return this._keys;
    }

    async setAutoLockInterval(interval) {
      return this.storageManager.setItem(PasscodeManager.AutoLockIntervalKey, JSON.stringify(interval), StorageManager.Fixed);
    }

    async getAutoLockInterval() {
      let interval = await this.storageManager.getItem(PasscodeManager.AutoLockIntervalKey, StorageManager.Fixed);
      if(interval) {
        return JSON.parse(interval);
      } else {
        return PasscodeManager.AutoLockIntervalNone;
      }
    }

    passcodeAuthParams() {
      var authParams = JSON.parse(this.storageManager.getItemSync("offlineParams", StorageManager.Fixed));
      if(authParams && !authParams.version) {
        var keys = this.keys();
        if(keys && keys.ak) {
          // If there's no version stored, and there's an ak, it has to be 002. Newer versions would have their version stored in authParams.
          authParams.version = "002";
        } else {
          authParams.version = "001";
        }
      }
      return authParams;
    }

    async verifyPasscode(passcode) {
      return new Promise(async (resolve, reject) => {
        var params = this.passcodeAuthParams();
        let keys = await SFJS.crypto.computeEncryptionKeysForUser(passcode, params);
        if(keys.pw !== params.hash) {
          resolve(false);
        } else {
          resolve(true);
        }
      })
    }

    unlock(passcode, callback) {
      var params = this.passcodeAuthParams();
      SFJS.crypto.computeEncryptionKeysForUser(passcode, params).then((keys) => {
        if(keys.pw !== params.hash) {
          callback(false);
          return;
        }

        this._keys = keys;
        this._authParams = params;
        this.decryptLocalStorage(keys, params).then(() => {
          this._locked = false;
          callback(true);
        })
      });
    }

    setPasscode(passcode, callback) {
      var uuid = SFJS.crypto.generateUUIDSync();

      SFJS.crypto.generateInitialKeysAndAuthParamsForUser(uuid, passcode).then((results) => {
        let keys = results.keys;
        let authParams = results.authParams;

        authParams.hash = keys.pw;
        this._keys = keys;
        this._hasPasscode = true;
        this._authParams = authParams;

        // Encrypting will initially clear localStorage
        this.encryptLocalStorage(keys, authParams);

        // After it's cleared, it's safe to write to it
        this.storageManager.setItem("offlineParams", JSON.stringify(authParams), StorageManager.Fixed);
        callback(true);
      });
    }

    changePasscode(newPasscode, callback) {
      this.setPasscode(newPasscode, callback);
    }

    clearPasscode() {
      this.storageManager.setItemsMode(this.authManager.isEphemeralSession() ? StorageManager.Ephemeral : StorageManager.Fixed); // Transfer from Ephemeral
      this.storageManager.removeItem("offlineParams", StorageManager.Fixed);
      this._keys = null;
      this._hasPasscode = false;
    }

    encryptLocalStorage(keys, authParams) {
      this.storageManager.setKeys(keys, authParams);
      // Switch to Ephemeral storage, wiping Fixed storage
      // Last argument is `force`, which we set to true because in the case of changing passcode
      this.storageManager.setItemsMode(this.authManager.isEphemeralSession() ? StorageManager.Ephemeral : StorageManager.FixedEncrypted, true);
    }

    async decryptLocalStorage(keys, authParams) {
      this.storageManager.setKeys(keys, authParams);
      return this.storageManager.decryptStorage();
    }
}

angular.module('app').service('passcodeManager', PasscodeManager);

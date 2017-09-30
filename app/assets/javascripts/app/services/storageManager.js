class MemoryStorage {
  constructor() {
    this.memory = {};
  }

  getItem(key) {
    return this.memory[key] || null;
  }

  get length() {
    return Object.keys(this.memory).length;
  }

  setItem(key, value) {
    this.memory[key] = value;
  }

  removeItem(key) {
    delete this.memory[key];
  }

  clear() {
    this.memory = {};
  }

  keys() {
    return Object.keys(this.memory);
  }

  key(index) {
    return Object.keys(this.memory)[index];
  }
}

class StorageManager {

  constructor(dbManager) {
    this.dbManager = dbManager;
  }

  initialize(hasPasscode, ephemeral) {
    if(hasPasscode) {
      // We don't want to save anything in fixed storage except for actual item data (in IndexedDB)
      this.storage = this.memoryStorage;
      console.log("Using MemoryStorage Because Has Passcode");
    } else if(ephemeral) {
      // We don't want to save anything in fixed storage as well as IndexedDB
      this.storage = this.memoryStorage;
      console.log("Using MemoryStorage Because Ephemeral Login");
    } else {
      console.log("Using LocalStorage");
      this.storage = localStorage;
    }

    this.modelStorageMode = ephemeral ? StorageManager.Ephemeral : StorageManager.Fixed;
    console.log("Initial Model Storage Mode", this.modelStorageMode);
  }

  get memoryStorage() {
    if(!this._memoryStorage) {
      this._memoryStorage = new MemoryStorage();
    }
    return this._memoryStorage;
  }

  setItemsMode(mode) {
    var newStorage = this.getVault(mode);
    if(newStorage !== this.storage) {
      // transfer storages
      var length = this.storage.length;
      for(var i = 0; i < length; i++) {
        var key = this.storage.key(i);
        newStorage.setItem(key, this.storage.getItem(key));
      }

      this.storage.clear();
      this.storage = newStorage;

      if(mode == StorageManager.FixedEncrypted) {
        this.writeEncryptedStorageToDisk();
      } else if(mode == StorageManager.Fixed) {
        // Remove encrypted storage
        this.removeItem("encryptedStorage", StorageManager.Fixed);
      }
    }
  }

  getVault(vaultKey) {
    if(vaultKey) {
      return this.storageForVault(vaultKey);
    } else {
      return this.storage;
    }
  }

  storageForVault(vault) {
    if(vault == StorageManager.Ephemeral || vault == StorageManager.FixedEncrypted) {
      return this.memoryStorage;
    } else {
      return localStorage;
    }
  }

  setItem(key, value, vault) {
    var storage = this.getVault(vault);
    storage.setItem(key, value);

    if(vault === StorageManager.FixedEncrypted) {
      this.writeEncryptedStorageToDisk();
    }
  }

  getItem(key, vault) {
    var storage = this.getVault(vault);
    return storage.getItem(key);
  }

  removeItem(key, vault) {
    var storage = this.getVault(vault);
    storage.removeItem(key);
  }

  clear() {
    this.memoryStorage.clear();
    localStorage.clear();
  }

  storageAsHash() {
    var hash = {};
    var length = this.storage.length;
    for(var i = 0; i < length; i++) {
      var key = this.storage.key(i);
      hash[key] = this.storage.getItem(key)
    }
    return hash;
  }

  setKeys(keys) {
    this.encryptedStorageKeys = keys;
  }

  writeEncryptedStorageToDisk() {
    var passcodeItem = new OfflinePasscode();
    // Copy over totality of current storage
    passcodeItem.storage = this.storageAsHash();
    // Save new encrypted storage in Fixed storage
    var params = new ItemParams(passcodeItem, this.encryptedStorageKeys);
    this.setItem("encryptedStorage", JSON.stringify(params.paramsForSync()), StorageManager.Fixed);
  }

  decryptStorage() {
    var stored = JSON.parse(this.getItem("encryptedStorage", StorageManager.Fixed));
    EncryptionHelper.decryptItem(stored, this.encryptedStorageKeys);
    var passcodeItem = new OfflinePasscode(stored);

    for(var key of Object.keys(passcodeItem.storage)) {
      this.setItem(key, passcodeItem.storage[key]);
    }
  }

  hasPasscode() {
    return this.getItem("encryptedStorage", StorageManager.Fixed) !== null;
  }


  /*
  Model Storage

  If using ephemeral storage, we don't need to write it to anything as references will be held already by controllers
  and the global modelManager service.
  */

  setModelStorageMode(mode) {
    if(mode == this.modelStorageMode) {
      return;
    }

    if(mode == StorageManager.Ephemeral) {
      // Clear IndexedDB
      this.dbManager.clearAllModels(null);
    } else {
      // Fixed
    }

    this.modelStorageMode = mode;
  }

  getAllModels(callback) {
    if(this.modelStorageMode == StorageManager.Fixed) {
      this.dbManager.getAllModels(callback);
    } else {
      callback && callback();
    }
  }

  saveModel(item) {
    if(this.modelStorageMode == StorageManager.Fixed) {
      this.dbManager.saveModel(item);
    }
  }

  saveModels(items, callback) {
    if(this.modelStorageMode == StorageManager.Fixed) {
      this.dbManager.saveModels(items, callback);
    } else {
      callback && callback();
    }
  }

  deleteModel(item, callback) {
    if(this.modelStorageMode == StorageManager.Fixed) {
      this.dbManager.deleteModel(item, callback);
    } else {
      callback && callback();
    }
  }

  clearAllModels(callback) {
    this.dbManager.clearAllModels(callback);
  }
}

StorageManager.FixedEncrypted = "FixedEncrypted"; // encrypted memoryStorage + localStorage persistence
StorageManager.Ephemeral = "Ephemeral"; // memoryStorage
StorageManager.Fixed = "Fixed"; // localStorage

angular.module('app.frontend').service('storageManager', StorageManager);

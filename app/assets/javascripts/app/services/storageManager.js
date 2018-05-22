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
      this.itemsStorageMode = StorageManager.FixedEncrypted;
    } else if(ephemeral) {
      // We don't want to save anything in fixed storage as well as IndexedDB
      this.storage = this.memoryStorage;
      this.itemsStorageMode = StorageManager.Ephemeral;
    } else {
      this.storage = localStorage;
      this.itemsStorageMode = StorageManager.Fixed;
    }

    this.modelStorageMode = ephemeral ? StorageManager.Ephemeral : StorageManager.Fixed;
  }

  get memoryStorage() {
    if(!this._memoryStorage) {
      this._memoryStorage = new MemoryStorage();
    }
    return this._memoryStorage;
  }

  setItemsMode(mode, force) {
    var newStorage = this.getVault(mode);
    if(newStorage !== this.storage || mode !== this.itemsStorageMode || force) {
      // transfer storages
      var length = this.storage.length;
      for(var i = 0; i < length; i++) {
        var key = this.storage.key(i);
        newStorage.setItem(key, this.storage.getItem(key));
      }

      this.itemsStorageMode = mode;
      if(newStorage !== this.storage) {
        // Only clear if this.storage isn't the same reference as newStorage
        this.storage.clear();
      }
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
      if(vaultKey == StorageManager.Ephemeral || vaultKey == StorageManager.FixedEncrypted) {
        return this.memoryStorage;
      } else {
        return localStorage;
      }
    } else {
      return this.storage;
    }
  }

  setItem(key, value, vaultKey) {
    var storage = this.getVault(vaultKey);
    storage.setItem(key, value);

    if(vaultKey === StorageManager.FixedEncrypted || (!vaultKey && this.itemsStorageMode === StorageManager.FixedEncrypted)) {
      this.writeEncryptedStorageToDisk();
    }
  }

  getItem(key, vault) {
    var storage = this.getVault(vault);
    return storage.getItem(key);
  }

  setBooleanValue(key, value, vault) {
    this.setItem(key, JSON.stringify(value), vault);
  }

  getBooleanValue(key, vault) {
    return JSON.parse(this.getItem(key, vault));
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

  setKeys(keys, authParams) {
    this.encryptedStorageKeys = keys;
    this.encryptedStorageAuthParams = authParams;
  }

  writeEncryptedStorageToDisk() {
    var encryptedStorage = new EncryptedStorage();
    // Copy over totality of current storage
    encryptedStorage.storage = this.storageAsHash();

    // Save new encrypted storage in Fixed storage
    var params = new ItemParams(encryptedStorage, this.encryptedStorageKeys, this.encryptedStorageAuthParams.version);
    params.paramsForSync().then((syncParams) => {
      this.setItem("encryptedStorage", JSON.stringify(syncParams), StorageManager.Fixed);
    })
  }

  async decryptStorage() {
    var stored = JSON.parse(this.getItem("encryptedStorage", StorageManager.Fixed));
    await SFJS.itemTransformer.decryptItem(stored, this.encryptedStorageKeys);
    var encryptedStorage = new EncryptedStorage(stored);

    for(var key of Object.keys(encryptedStorage.storage)) {
      this.setItem(key, encryptedStorage.storage[key]);
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
    this.saveModels([item]);
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

angular.module('app').service('storageManager', StorageManager);

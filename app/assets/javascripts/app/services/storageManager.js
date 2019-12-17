import { cryptoManager, SNEncryptedStorage, SFStorageManager , SFItemParams } from 'snjs';

export class MemoryStorage {
  constructor() {
    this.memory = {};
  }

  getItem(key) {
    return this.memory[key] || null;
  }

  getItemSync(key) {
    return this.getItem(key);
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

export class StorageManager extends SFStorageManager {

  /* @ngInject */
  constructor(dbManager, alertManager) {
    super();
    this.dbManager = dbManager;
    this.alertManager = alertManager;
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

  async setItem(key, value, vaultKey) {
    var storage = this.getVault(vaultKey);
    try {
      storage.setItem(key, value);
    } catch (e) {
      console.error("Exception while trying to setItem in StorageManager:", e);
      this.alertManager.alert({text: "The application's local storage is out of space. If you have Session History save-to-disk enabled, please disable it, and try again."});
    }

    if(vaultKey === StorageManager.FixedEncrypted || (!vaultKey && this.itemsStorageMode === StorageManager.FixedEncrypted)) {
      return this.writeEncryptedStorageToDisk();
    }
  }

  async getItem(key, vault) {
    return this.getItemSync(key, vault);
  }

  getItemSync(key, vault) {
    var storage = this.getVault(vault);
    return storage.getItem(key);
  }

  async removeItem(key, vault) {
    var storage = this.getVault(vault);
    return storage.removeItem(key);
  }

  async clear() {
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

  async writeEncryptedStorageToDisk() {
    var encryptedStorage = new SNEncryptedStorage();
    // Copy over totality of current storage
    encryptedStorage.content.storage = this.storageAsHash();

    // Save new encrypted storage in Fixed storage
    var params = new SFItemParams(encryptedStorage, this.encryptedStorageKeys, this.encryptedStorageAuthParams);
    const syncParams = await params.paramsForSync();
    this.setItem("encryptedStorage", JSON.stringify(syncParams), StorageManager.Fixed);
  }

  async decryptStorage() {
    var stored = JSON.parse(this.getItemSync("encryptedStorage", StorageManager.Fixed));
    await cryptoManager.decryptItem(stored, this.encryptedStorageKeys);
    var encryptedStorage = new SNEncryptedStorage(stored);

    for(var key of Object.keys(encryptedStorage.content.storage)) {
      this.setItem(key, encryptedStorage.storage[key]);
    }
  }

  hasPasscode() {
    return this.getItemSync("encryptedStorage", StorageManager.Fixed) !== null;
  }

  bestStorageMode() {
    return this.hasPasscode() ? StorageManager.FixedEncrypted : StorageManager.Fixed;
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

  async getAllModels() {
    return new Promise((resolve, reject) => {
      if(this.modelStorageMode == StorageManager.Fixed) {
        this.dbManager.getAllModels(resolve);
      } else {
        resolve();
      }
    })
  }

  async saveModel(item) {
    return this.saveModels([item]);
  }

  async saveModels(items, onsuccess, onerror) {
    return new Promise((resolve, reject) => {
      if(this.modelStorageMode == StorageManager.Fixed) {
        this.dbManager.saveModels(items, resolve, reject);
      } else {
        resolve();
      }
    });
  }

  async deleteModel(item) {
    return new Promise((resolve, reject) => {
      if(this.modelStorageMode == StorageManager.Fixed) {
        this.dbManager.deleteModel(item, resolve);
      } else {
        resolve();
      }
    });
  }

  async clearAllModels() {
    return new Promise((resolve, reject) => {
      this.dbManager.clearAllModels(resolve);
    });
  }
}

StorageManager.FixedEncrypted = "FixedEncrypted"; // encrypted memoryStorage + localStorage persistence
StorageManager.Ephemeral = "Ephemeral"; // memoryStorage
StorageManager.Fixed = "Fixed"; // localStorage

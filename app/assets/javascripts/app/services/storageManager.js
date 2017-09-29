class StorageManager {

  constructor() {
    this.storage = sessionStorage;
  }

  setMode(mode) {
    this.storage = this.getVault(mode);
  }

  getVault(vaultKey) {
    var storage = this.storage;
    if(vaultKey) {
      storage = this.storageForVault(vault);
    }
    return storage;
  }

  setItem(key, value, vault) {
    var storage = this.getVault(vault);
    storage.setItem(key, value);
  }

  getItem(key, vault) {
    var storage = this.getVault(vault);
    return storage.getItem(key);
  }

  removeItem(key, vault) {
    var storage = this.getVault(vault);
    storage.removeItem(key);
  }

  clear(vault) {
    var storage = this.getVault(vault);
    this.storage.clear();
  }

  storageForVault(vault) {
    if(vault == StorageManager.Ephemeral) {
      return sessionStorage;
    } else {
      return localStorage;
    }
  }


  // In the case of using sessionStorage, it is cleared after app quit. However, while that is cleared
  // automatically, IndexedDB needs to be cleared manually. So we check if sessionStorage and localStorage
  // are empty, and use that to delete IndexedDB before starting the app.
  isStorageEmpty() {
    return sessionStorage.length == 0 && localStorage.length == 0;
  }

}

StorageManager.Ephemeral = "Ephemeral"; // sessionStorage
StorageManager.Fixed = "Fixed"; // localStorage

angular.module('app.frontend').service('storageManager', StorageManager);

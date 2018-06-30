// A test StorageManager class using LocalStorage

export default class LocalStorageManager extends SFStorageManager {

  /* Simple Key/Value Storage */

  async setItem(key, value, vaultKey) {
    localStorage.setItem(key, value);
  }

  async getItem(key, vault) {
    return localStorage.getItem(key)
  }

  async removeItem(key, vault) {
    localStorage.removeItem(key);
  }

  async clear() {
    // clear only simple key/values
    localStorage.clear();
  }

  /*
  Model Storage
  */

  async getAllModels() {
    var models = [];
    for(var key in localStorage) {
      if(key.startsWith("item-")) {
        models.push(JSON.parse(localStorage[key]))
      }
    }
    return models;
  }

  async saveModel(item) {
    return this.saveModels([item]);
  }

  async saveModels(items) {
    return Promise.all(items.map((item) => {
      return this.setItem(`item-${item.uuid}`, JSON.stringify(item));
    }))
  }

  async deleteModel(item,) {
    return this.removeItem(`item-${item.uuid}`);
  }

  async clearAllModels() {
    // clear only models
    for(var key in localStorage) {
      if(key.startsWith("item-")) {
        this.removeItem(`item-${item.uuid}`);
      }
    }
  }

  /* General */

  clearAllData() {
    return Promise.all([
      this.clear(),
      this.clearAllModels()
    ])
  }
}

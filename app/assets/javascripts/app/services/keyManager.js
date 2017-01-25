class KeyManager {

  constructor() {
    this.keys = JSON.parse(localStorage.getItem("keys")) || [];
  }

  addKey(name, key) {
    this.keys.push({name: name, key: key});
    this.persist();
  }

  keyForName(name) {
    return _.find(this.keys, {name: name});
  }

  deleteKey(name) {
    _.pull(this.keys, {name: name});
    this.persist();
  }

  persist() {
    localStorage.setItem("keys", JSON.stringify(this.keys));
  }
}

angular.module('app.frontend').service('keyManager', KeyManager);

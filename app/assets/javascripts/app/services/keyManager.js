class KeyManager {

  constructor() {
    this.keys = JSON.parse(localStorage.getItem("keys")) || [];
  }

  addKey(name, key) {
    var existing = this.keyForName(name);
    if(existing) {
      return null;
    }

    var newKey = {name: name, key: key};
    this.keys.push(newKey);
    this.persist();
    return newKey;
  }

  keyForName(name) {
    return _.find(this.keys, function(key){
      return key.name.toLowerCase() == name.toLowerCase();
    });
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

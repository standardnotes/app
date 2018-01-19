class PackageManager {

  constructor(httpManager, modelManager, syncManager, componentManager) {
    this.httpManager = httpManager;
    this.modelManager = modelManager;
    this.syncManager = syncManager;
    this.componentManager = componentManager;
  }

  installPackage(url, callback) {
    this.httpManager.getAbsolute(url, {}, function(aPackage){
      console.log("Got package data", aPackage);
      if(typeof aPackage !== 'object') {
        callback(null);
        return;
      }

      // Remove private properties
      this.componentManager.removePrivatePropertiesFromResponseItems([aPackage]);

      aPackage.package_info = Object.assign({}, aPackage);

      var assembled = this.modelManager.createItem(aPackage);;
      this.modelManager.addItem(assembled);

      assembled.setDirty(true);
      this.syncManager.sync();

      console.log("Created assembled", assembled);

      callback && callback(assembled);
    }.bind(this), function(response){
      console.error("Error retrieving package", response);
      callback(null);
    })
  }


}

angular.module('app').service('packageManager', PackageManager);

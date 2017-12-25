class PackageManager {

  constructor(httpManager, modelManager, syncManager) {
    this.httpManager = httpManager;
    this.modelManager = modelManager;
    this.syncManager = syncManager;
  }


  installPackage(url, callback) {
    this.httpManager.getAbsolute(url, {}, function(aPackage){
      console.log("Got package data", aPackage);
      if(typeof aPackage !== 'object') {
        callback(null);
        return;
      }

      var assembled = this.modelManager.createItem(aPackage);
      assembled.package_info = aPackage;
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

angular.module('app.frontend').service('packageManager', PackageManager);

class HttpManager extends SFHttpManager {

  constructor(storageManager, $timeout) {
    // calling callbacks in a $timeout allows UI to update
    super($timeout);

    this.setJWTRequestHandler(async () => {
      return storageManager.getItem("jwt");
    })
  }
}

angular.module('app').service('httpManager', HttpManager);

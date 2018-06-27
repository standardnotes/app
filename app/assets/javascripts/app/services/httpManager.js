class HttpManager extends SFHttpManager {

  constructor(storageManager, $timeout) {
    // calling callbacks in a $timeout allows UI to update
    super(storageManager, $timeout);
  }
}

angular.module('app').service('httpManager', HttpManager);

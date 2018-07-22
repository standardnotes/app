class SyncManager extends SFSyncManager {

  constructor(modelManager, storageManager, httpManager, $timeout, $interval) {
    super(modelManager, storageManager, httpManager, $timeout, $interval);
  }
}

angular.module('app').service('syncManager', SyncManager);

class SingletonManager extends SFSingletonManager {

  constructor(modelManager, syncManager) {
    super(modelManager, syncManager);
  }
}

angular.module('app').service('singletonManager', SingletonManager);

class SyncManager extends SFSyncManager {

  constructor(modelManager, storageManager, httpManager, $timeout, $interval, $compile, $rootScope) {
    super(modelManager, storageManager, httpManager, $timeout, $interval);
    this.$rootScope = $rootScope;
    this.$compile = $compile;
  }

  presentConflictResolutionModal(items, callback) {
    var scope = this.$rootScope.$new(true);
    scope.item1 = items[0];
    scope.item2 = items[1];
    scope.callback = callback;
    var el = this.$compile( "<conflict-resolution-modal item1='item1' item2='item2' callback='callback' class='modal'></conflict-resolution-modal>" )(scope);
    angular.element(document.body).append(el);
  }

}

angular.module('app').service('syncManager', SyncManager);

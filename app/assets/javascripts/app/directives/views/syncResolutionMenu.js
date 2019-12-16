import template from '%/directives/sync-resolution-menu.pug';

export class SyncResolutionMenu {
  constructor() {
    this.restrict = 'E';
    this.template = template;
    this.scope = {
      closeFunction: '&'
    };
  }

  /* @ngInject */
  controller($scope, modelManager, syncManager, archiveManager, $timeout) {
    $scope.status = {};

    $scope.close = function() {
      $timeout(() => {
        $scope.closeFunction()();
      })
    }

    $scope.downloadBackup = function(encrypted) {
      archiveManager.downloadBackup(encrypted);
      $scope.status.backupFinished = true;
    }

    $scope.skipBackup = function() {
      $scope.status.backupFinished = true;
    }

    $scope.performSyncResolution = function() {
      $scope.status.resolving = true;
      syncManager.resolveOutOfSync().then(() => {
        $scope.status.resolving = false;
        $scope.status.attemptedResolution = true;
        if(syncManager.isOutOfSync()) {
          $scope.status.fail = true;
        } else {
          $scope.status.success = true;
        }
      })
    }
  }
}

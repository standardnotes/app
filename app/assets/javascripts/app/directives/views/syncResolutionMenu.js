class SyncResolutionMenu {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "directives/sync-resolution-menu.html";
    this.scope = {
      "closeFunction" : "&"
    };
  }

  controller($scope, modelManager, syncManager, archiveManager, $timeout) {
    'ngInject';

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

angular.module('app').directive('syncResolutionMenu', () => new SyncResolutionMenu);

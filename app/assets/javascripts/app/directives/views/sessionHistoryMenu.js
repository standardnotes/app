import template from '%/directives/session-history-menu.pug';

export class SessionHistoryMenu {
  constructor() {
    this.restrict = 'E';
    this.template = template;
    this.scope = {
      item: '='
    };
  }

  /* @ngInject */
  controller($scope, modelManager, sessionHistory, actionsManager, $timeout, alertManager) {
    $scope.diskEnabled = sessionHistory.diskEnabled;
    $scope.autoOptimize = sessionHistory.autoOptimize;

    $scope.reloadHistory = function() {
      let history = sessionHistory.historyForItem($scope.item);
      // make copy as not to sort inline
      $scope.entries = history.entries.slice(0).sort((a, b) => {
        return a.item.updated_at < b.item.updated_at ? 1 : -1;
      })
      $scope.history = history;
    }

    $scope.reloadHistory();

    $scope.openRevision = function(revision) {
      actionsManager.presentRevisionPreviewModal(revision.item.uuid, revision.item.content);
    }

    $scope.classForRevision = function(revision) {
      var vector = revision.operationVector();
      if(vector == 0) {
        return "default";
      } else if(vector == 1) {
        return "success";
      } else if(vector == -1) {
        return "danger";
      }
    }

    $scope.clearItemHistory = function() {
      alertManager.confirm({text: "Are you sure you want to delete the local session history for this note?", destructive: true, onConfirm: () => {
        sessionHistory.clearHistoryForItem($scope.item).then(() => {
          $timeout(() => {
            $scope.reloadHistory();
          })
        });
      }})
    }

    $scope.clearAllHistory = function() {
      alertManager.confirm({text: "Are you sure you want to delete the local session history for all notes?", destructive: true, onConfirm: () => {
        sessionHistory.clearAllHistory().then(() => {
          $timeout(() => {
            $scope.reloadHistory();
          })
        });
      }})
    }

    $scope.toggleDiskSaving = function() {
      const run = () => {
        sessionHistory.toggleDiskSaving().then(() => {
          $timeout(() => {
            $scope.diskEnabled = sessionHistory.diskEnabled;
          })
        });
      }

      if(!sessionHistory.diskEnabled) {
        alertManager.confirm({text: "Are you sure you want to save history to disk? This will decrease general performance, especially as you type. You are advised to disable this feature if you experience any lagging.", destructive: true, onConfirm: () => {
          run();
        }})
      } else {
        run();
      }
    }

    $scope.toggleAutoOptimize = function() {
      sessionHistory.toggleAutoOptimize().then(() => {
        $timeout(() => {
          $scope.autoOptimize = sessionHistory.autoOptimize;
        })
      });
    }
  }
}

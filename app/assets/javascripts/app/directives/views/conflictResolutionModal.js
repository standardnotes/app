/*
  The purpose of the conflict resoltion modal is to present two versions of a conflicted item,
  and allow the user to choose which to keep (or to keep both.)
*/

import template from '%/directives/conflict-resolution-modal.pug';

export class ConflictResolutionModal {
  constructor() {
    this.restrict = 'E';
    this.template = template;
    this.scope = {
      item1: '=',
      item2: '=',
      callback: '='
    };
  }

  link($scope, el, attrs) {

    $scope.dismiss = function() {
      el.remove();
    }
  }

  /* @ngInject */
  controller($scope, modelManager, syncManager, archiveManager, alertManager) {
    $scope.createContentString = function(item) {
      return JSON.stringify(
        Object.assign({created_at: item.created_at, updated_at: item.updated_at}, item.content), null, 2
      )
    }

    $scope.contentType = $scope.item1.content_type;

    $scope.item1Content = $scope.createContentString($scope.item1);
    $scope.item2Content = $scope.createContentString($scope.item2);

    $scope.keepItem1 = function() {
      alertManager.confirm({text: `Are you sure you want to delete the item on the right?`, destructive: true, onConfirm: () => {
        modelManager.setItemToBeDeleted($scope.item2);
        syncManager.sync().then(() => {
          $scope.applyCallback();
        })

        $scope.dismiss();
      }});
    }

    $scope.keepItem2 = function() {
      alertManager.confirm({text: `Are you sure you want to delete the item on the left?`, destructive: true, onConfirm: () => {
        modelManager.setItemToBeDeleted($scope.item1);
        syncManager.sync().then(() => {
          $scope.applyCallback();
        })

        $scope.dismiss();
      }});
    }

    $scope.keepBoth = function() {
      $scope.applyCallback();
      $scope.dismiss();
    }

    $scope.export = function() {
      archiveManager.downloadBackupOfItems([$scope.item1, $scope.item2], true);
    }

    $scope.applyCallback = function() {
      $scope.callback && $scope.callback();
    }
  }
}

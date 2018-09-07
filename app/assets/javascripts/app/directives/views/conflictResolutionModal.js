/*
  The purpose of the conflict resoltion modal is to present two versions of a conflicted item,
  and allow the user to choose which to keep (or to keep both.)
*/

class ConflictResolutionModal {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "directives/conflict-resolution-modal.html";
    this.scope = {
      item1: "=",
      item2: "=",
      callback: "="
    };
  }

  link($scope, el, attrs) {

    $scope.dismiss = function() {
      el.remove();
    }
  }

  controller($scope, modelManager, syncManager) {
    'ngInject';

    $scope.createContentString = function(item) {
      return JSON.stringify(
        Object.assign({created_at: item.created_at, updated_at: item.updated_at}, item.content), null, 2
      )
    }

    $scope.contentType = $scope.item1.content_type;

    $scope.item1Content = $scope.createContentString($scope.item1);
    $scope.item2Content = $scope.createContentString($scope.item2);

    $scope.keepItem1 = function() {
      if(!confirm("Are you sure you want to delete the item on the right?")) {
        return;
      }
      modelManager.setItemToBeDeleted($scope.item2);
      syncManager.sync().then(() => {
        $scope.applyCallback();
      })

      $scope.dismiss();
    }

    $scope.keepItem2 = function() {
      if(!confirm("Are you sure you want to delete the item on the left?")) {
        return;
      }
      modelManager.setItemToBeDeleted($scope.item1);
      syncManager.sync().then(() => {
        $scope.applyCallback();
      })

      $scope.dismiss();
    }

    $scope.keepBoth = function() {
      $scope.applyCallback();
      $scope.dismiss();
    }

    $scope.applyCallback = function() {
      $scope.callback && $scope.callback();
    }

  }
}

angular.module('app').directive('conflictResolutionModal', () => new ConflictResolutionModal);

class InputModal {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "directives/input-modal.html";
    this.scope = {
      type: "=",
      title: "=",
      message: "=",
      placeholder: "=",
      callback: "&"
    };
  }

  link($scope, el, attrs) {
    $scope.el = el;
  }

  controller($scope, modelManager, archiveManager, authManager, syncManager, $timeout) {
    'ngInject';

    $scope.formData = {};

    $scope.dismiss = function() {
      $scope.el.remove();
      $scope.$destroy();
    }

    $scope.submit = function() {
      $scope.callback()($scope.formData.input);
      $scope.dismiss();
    }


  }
}

angular.module('app').directive('inputModal', () => new InputModal);

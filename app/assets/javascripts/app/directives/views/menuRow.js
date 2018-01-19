class MenuRow {

  constructor() {
    this.restrict = "E";
    this.transclude = true;
    this.templateUrl = "directives/menu-row.html";
    this.scope = {
      circle: "=",
      title: "=",
      subtite: "=",
      hasButton: "=",
      buttonText: "=",
      buttonClass: "=",
      buttonAction: "&",
      spinnerClass: "=",
      subRows: "="
    };
  }

  controller($scope, componentManager) {
    'ngInject';

    $scope.clickButton = function($event) {
      $event.stopPropagation();
      $scope.buttonAction();
    }

  }
}

angular.module('app').directive('menuRow', () => new MenuRow);

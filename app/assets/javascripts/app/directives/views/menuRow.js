class MenuRow {

  constructor() {
    this.restrict = "E";
    this.transclude = true;
    this.templateUrl = "directives/menu-row.html";
    this.scope = {
      action: "&",
      circle: "=",
      label: "=",
      subtitle: "=",
      hasButton: "=",
      buttonText: "=",
      buttonClass: "=",
      buttonAction: "&",
      spinnerClass: "=",
      subRows: "=",
      faded: "=",
      desc: "=",
      disabled: "="
    };
  }

  controller($scope, componentManager) {
    'ngInject';

    $scope.onClick = function($event) {
      if($scope.disabled) {
        return;
      }
      $event.stopPropagation();
      $scope.action();
    }

    // This is for the accessory button
    $scope.clickButton = function($event) {
      if($scope.disabled) {
        return;
      }
      $event.stopPropagation();
      $scope.buttonAction();
    }

  }
}

angular.module('app').directive('menuRow', () => new MenuRow);

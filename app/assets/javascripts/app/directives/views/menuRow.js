import template from '%/directives/menu-row.pug';

export class MenuRow {
  constructor() {
    this.restrict = 'E';
    this.transclude = true;
    this.template = template;
    this.scope = {
      action: '&',
      circle: '=',
      circleAlign: '=',
      label: '=',
      subtitle: '=',
      hasButton: '=',
      buttonText: '=',
      buttonClass: '=',
      buttonAction: '&',
      spinnerClass: '=',
      subRows: '=',
      faded: '=',
      desc: '=',
      disabled: '=',
      stylekitClass: '='
    };
  }

  /* @ngInject */
  controller($scope, componentManager) {
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

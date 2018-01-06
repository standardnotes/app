class MenuRow {

  constructor() {
    this.restrict = "E";
    this.transclude = true;
    this.templateUrl = "frontend/directives/menu-row.html";
    this.scope = {
      circle: "=",
      title: "=",
      subtite: "="
    };
  }

  controller($scope, componentManager) {
    'ngInject';

  }
}

angular.module('app.frontend').directive('menuRow', () => new MenuRow);

class AccountDataMenu {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/account-data-menu.html";
    this.scope = {
    };
  }

  controller($scope, apiController, modelManager) {
    'ngInject';


  }
}

angular.module('app.frontend').directive('accountDataMenu', () => new AccountDataMenu);

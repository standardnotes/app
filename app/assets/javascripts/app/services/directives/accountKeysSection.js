class AccountKeysSection {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/account-keys-section.html";
    this.scope = {
    };
  }

  controller($scope, apiController, keyManager) {
    'ngInject';

    $scope.newKeyData = {};
    $scope.keys = keyManager.keys;
    
    $scope.submitNewKeyForm = function() {
      keyManager.addKey($scope.newKeyData.name, $scope.newKeyData.key);
      $scope.newKeyData.showForm = false;
    }
  }
}

angular.module('app.frontend').directive('accountKeysSection', () => new AccountKeysSection);

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
      var key = keyManager.addKey($scope.newKeyData.name, $scope.newKeyData.key);
      if(!key) {
        alert("This key name is already in use. Please use a different name.");
        return;
      }
      
      $scope.newKeyData.showForm = false;
    }
  }
}

angular.module('app.frontend').directive('accountKeysSection', () => new AccountKeysSection);

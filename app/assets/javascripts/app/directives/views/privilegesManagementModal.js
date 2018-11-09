class PrivilegesManagementModal {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "directives/privileges-management-modal.html";
    this.scope = {

    };
  }

  link($scope, el, attrs) {
    $scope.dismiss = function() {
      el.remove();
    }
  }

  controller($scope, privilegesManager, $timeout) {
    'ngInject';

    $scope.reloadPrivileges = async function() {
      console.log("Reloading privs");
      $scope.availableActions = privilegesManager.getAvailableActions();
      $scope.availableCredentials = privilegesManager.getAvailableCredentials();

      let metadata = {};
      for(let action of $scope.availableActions) {
        var requiredCreds = await privilegesManager.requiredCredentialsForAction(action);
        metadata[action] = {
          displayInfo: privilegesManager.displayInfoForAction(action),
          requiredCredentials: requiredCreds
        }

        metadata[action]["credentialValues"] = {};
        for(var availableCred of $scope.availableCredentials) {
          metadata[action]["credentialValues"][availableCred] = requiredCreds.includes(availableCred);
        }
      }

      $timeout(() => {
        $scope.metadata = metadata;
      })
    }

    $scope.checkboxValueChanged = function(action) {
      let credentialValues = $scope.metadata[action]["credentialValues"];
      let keys = Object.keys(credentialValues).filter((key) => {
        return credentialValues[key] == true;
      });
      privilegesManager.setCredentialsForAction(action, keys);
    }

    $scope.reloadPrivileges();

    $scope.cancel = function() {
      $scope.dismiss();
      $scope.onCancel && $scope.onCancel();
    }
  }
}

angular.module('app').directive('privilegesManagementModal', () => new PrivilegesManagementModal);

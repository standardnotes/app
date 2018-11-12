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

    $scope.dummy = {};

    $scope.displayInfoForCredential = function(credential) {
      return privilegesManager.displayInfoForCredential(credential).label;
    }

    $scope.displayInfoForAction = function(action) {
      return privilegesManager.displayInfoForAction(action).label;
    }

    $scope.isCredentialRequiredForAction = function(action, credential) {
      return $scope.privileges.isCredentialRequiredForAction(action, credential);
    }

    $scope.reloadPrivileges = async function() {
      $scope.privileges = await privilegesManager.getPrivileges();
      $scope.availableActions = privilegesManager.getAvailableActions();
      $scope.availableCredentials = privilegesManager.getAvailableCredentials();
    }

    $scope.checkboxValueChanged = function(action, credential) {
      $scope.privileges.toggleCredentialForAction(action, credential);
      privilegesManager.savePrivileges();
    }

    $scope.reloadPrivileges();

    $scope.cancel = function() {
      $scope.dismiss();
      $scope.onCancel && $scope.onCancel();
    }
  }
}

angular.module('app').directive('privilegesManagementModal', () => new PrivilegesManagementModal);

import { PrivilegesManager } from '@/services/privilegesManager';
import template from '%/directives/privileges-management-modal.pug';

export class PrivilegesManagementModal {
  constructor() {
    this.restrict = 'E';
    this.template = template;
    this.scope = {};
  }

  link($scope, el, attrs) {
    $scope.dismiss = function() {
      el.remove();
    }
  }

  /* @ngInject */
  controller($scope, privilegesManager, passcodeManager, authManager, $timeout) {
    $scope.dummy = {};

    $scope.hasPasscode = passcodeManager.hasPasscode();
    $scope.hasAccount = !authManager.offline();

    $scope.displayInfoForCredential = function(credential) {
      let info = privilegesManager.displayInfoForCredential(credential);
      if(credential == PrivilegesManager.CredentialLocalPasscode) {
        info["availability"] = $scope.hasPasscode;
      } else if(credential == PrivilegesManager.CredentialAccountPassword) {
        info["availability"] = $scope.hasAccount;
      } else {
        info["availability"] = true;
      }

      return info;
    }

    $scope.displayInfoForAction = function(action) {
      return privilegesManager.displayInfoForAction(action).label;
    }

    $scope.isCredentialRequiredForAction = function(action, credential) {
      if(!$scope.privileges) {
        return false;
      }
      return $scope.privileges.isCredentialRequiredForAction(action, credential);
    }

    $scope.clearSession = function() {
      privilegesManager.clearSession().then(() => {
        $scope.reloadPrivileges();
      })
    }

    $scope.reloadPrivileges = async function() {
      $scope.availableActions = privilegesManager.getAvailableActions();
      $scope.availableCredentials = privilegesManager.getAvailableCredentials();
      let sessionEndDate = await privilegesManager.getSessionExpirey();
      $scope.sessionExpirey = sessionEndDate.toLocaleString();
      $scope.sessionExpired = new Date() >= sessionEndDate;

      $scope.credentialDisplayInfo = {};
      for(let cred of $scope.availableCredentials) {
        $scope.credentialDisplayInfo[cred] = $scope.displayInfoForCredential(cred);
      }

      privilegesManager.getPrivileges().then((privs) => {
        $timeout(() => {
          $scope.privileges = privs;
        })
      })
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

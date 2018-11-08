class PrivilegesManager {

  constructor(passcodeManager, authManager, $rootScope, $compile) {
    this.passcodeManager = passcodeManager;
    this.authManager = authManager;
    this.$rootScope = $rootScope;
    this.$compile = $compile;

    PrivilegesManager.PrivilegeAccountPassword = "PrivilegeAccountPassword";
    PrivilegesManager.PrivilegeLocalPasscode = "PrivilegeLocalPasscode";

    PrivilegesManager.ActionManageExtensions = "ActionManageExtensions";
    PrivilegesManager.ActionDownloadBackup = "ActionDownloadBackup";
  }

  presentPrivilegesModal(action, onSuccess, onCancel) {

    let customSuccess = () => {
      onSuccess();
      this.currentAuthenticationElement = null;
    }

    let customCancel = () => {
      onCancel();
      this.currentAuthenticationElement = null;
    }

    var scope = this.$rootScope.$new(true);
    scope.action = action;
    scope.onSuccess = customSuccess;
    scope.onCancel = customCancel;
    var el = this.$compile( "<privileges-auth-modal action='action' on-success='onSuccess' on-cancel='onCancel' class='modal'></privileges-auth-modal>" )(scope);
    angular.element(document.body).append(el);

    this.currentAuthenticationElement = el;
  }

  authenticationInProgress() {
    return this.currentAuthenticationElement != null;
  }

  privilegesForAction(action) {
    return [
      {
        name: PrivilegesManager.PrivilegeAccountPassword,
        label: "Account Password",
        prompt: "Please enter your account password."
      },
      {
        name: PrivilegesManager.PrivilegeLocalPasscode,
        label: "Local Passcode",
        prompt: "Please enter your local passcode."
      }
    ]
  }

  actionRequiresPrivilege(action) {
    return this.privilegesForAction(action).length > 0;
  }

  async verifyPrivilegesForAction(action, inputPrivs) {

    let findInputPriv = (name) => {
      return inputPrivs.find((priv) => {
        return priv.name == name;
      })
    }

    var requiredPrivileges = this.privilegesForAction(action);
    var successfulPrivs = [], failedPrivs = [];
    for(let requiredPriv of requiredPrivileges) {
      var matchingPriv = findInputPriv(requiredPriv.name);
      var passesAuth = await this.verifyAuthenticationParameters(matchingPriv);
      if(passesAuth) {
        successfulPrivs.push(matchingPriv);
      } else {
        failedPrivs.push(matchingPriv);
      }
    }

    return {
      success: failedPrivs.length == 0,
      successfulPrivs: successfulPrivs,
      failedPrivs: failedPrivs
    }
  }

  async verifyAuthenticationParameters(parameters) {

    let verifyAccountPassword = async (password) => {
      return this.authManager.verifyAccountPassword(password);
    }

    let verifyLocalPasscode = async (passcode) => {
      return this.passcodeManager.verifyPasscode(passcode);
    }

    if(parameters.name == PrivilegesManager.PrivilegeAccountPassword) {
      return verifyAccountPassword(parameters.authenticationValue);
    } else if(parameters.name == PrivilegesManager.PrivilegeLocalPasscode) {
      return verifyLocalPasscode(parameters.authenticationValue);
    }
  }

}

angular.module('app').service('privilegesManager', PrivilegesManager);

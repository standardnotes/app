class PrivilegesManager {

  constructor(passcodeManager, authManager, singletonManager, modelManager, $rootScope, $compile) {
    this.passcodeManager = passcodeManager;
    this.authManager = authManager;
    this.singletonManager = singletonManager;
    this.modelManager = modelManager;
    this.$rootScope = $rootScope;
    this.$compile = $compile;

    this.loadPrivileges();

    PrivilegesManager.CredentialAccountPassword = "CredentialAccountPassword";
    PrivilegesManager.CredentialLocalPasscode = "CredentialLocalPasscode";

    PrivilegesManager.ActionManageExtensions = "ActionManageExtensions";
    PrivilegesManager.ActionDownloadBackup = "ActionDownloadBackup";

    this.availableActions = [
      PrivilegesManager.ActionManageExtensions,
      PrivilegesManager.ActionDownloadBackup
    ]

    this.availableCredentials = [
      PrivilegesManager.CredentialAccountPassword,
      PrivilegesManager.CredentialLocalPasscode
    ];
  }

  getAvailableActions() {
    return this.availableActions;
  }

  getAvailableCredentials() {
    return this.availableCredentials;
  }

  presentPrivilegesModal(action, onSuccess, onCancel) {

    let customSuccess = () => {
      onSuccess && onSuccess();
      this.currentAuthenticationElement = null;
    }

    let customCancel = () => {
      onCancel && onCancel();
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

  presentPrivilegesManagementModal() {
    var scope = this.$rootScope.$new(true);
    var el = this.$compile( "<privileges-management-modal class='modal'></privileges-management-modal>")(scope);
    angular.element(document.body).append(el);
  }

  authenticationInProgress() {
    return this.currentAuthenticationElement != null;
  }

  async loadPrivileges() {
    return new Promise((resolve, reject) => {
      let prefsContentType = "SN|Privileges";
      let contentTypePredicate = new SFPredicate("content_type", "=", prefsContentType);
      this.singletonManager.registerSingleton([contentTypePredicate], (resolvedSingleton) => {
        this.privileges = resolvedSingleton;
        if(!this.privileges.content.desktopPrivileges) {
          this.privileges.content.desktopPrivileges = [];
        }
        resolve(resolvedSingleton);
      }, (valueCallback) => {
        // Safe to create. Create and return object.
        var privs = new SFItem({content_type: prefsContentType});
        this.modelManager.addItem(privs);
        privs.setDirty(true);
        this.$rootScope.sync();
        valueCallback(privs);
        resolve(privs);
      });
    });
  }

  async getPrivileges() {
    if(this.privileges) {
      return this.privileges;
    } else {
      return this.loadPrivileges();
    }
  }

  async requiredCredentialsForAction(action) {
    let privs = await this.getPrivileges();
    return privs.content.desktopPrivileges[action] || [];
  }

  displayInfoForCredential(credential) {
    let metadata = {}

    metadata[PrivilegesManager.CredentialAccountPassword] = {
      label: "Account Password",
      prompt: "Please enter your account password."
    }

    metadata[PrivilegesManager.CredentialLocalPasscode] = {
      label: "Local Passcode",
      prompt: "Please enter your local passcode."
    }

    return metadata[credential];
  }

  displayInfoForAction(action) {
    let metadata = {};

    metadata[PrivilegesManager.ActionManageExtensions] = {
      label: "Manage Extensions"
    }
    metadata[PrivilegesManager.ActionDownloadBackup] = {
      label: "Download Backups"
    };

    return metadata[action];
  }

  async actionRequiresPrivilege(action) {
    return (await this.requiredCredentialsForAction(action)).length > 0;
  }

  async setCredentialsForAction(action, credentials) {
    console.log("Setting credentials for action", action, credentials);
    let privs = await this.getPrivileges();
    privs.content.desktopPrivileges[action] = credentials;
    this.savePrivileges();
  }

  async savePrivileges() {
    let privs = await this.getPrivileges();
    privs.setDirty(true);
    this.$rootScope.sync();
  }

  async authenticateAction(action, inputPrivs) {

    let findInputPriv = (name) => {
      return inputPrivs.find((priv) => {
        return priv.name == name;
      })
    }

    var requiredPrivileges = await this.requiredCredentialsForAction(action);
    var successfulPrivs = [], failedPrivs = [];
    for(let requiredPriv of requiredPrivileges) {
      var matchingPriv = findInputPriv(requiredPriv.name);
      var passesAuth = await this._verifyAuthenticationParameters(matchingPriv);
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

  async _verifyAuthenticationParameters(parameters) {

    let verifyAccountPassword = async (password) => {
      return this.authManager.verifyAccountPassword(password);
    }

    let verifyLocalPasscode = async (passcode) => {
      return this.passcodeManager.verifyPasscode(passcode);
    }

    if(parameters.name == PrivilegesManager.CredentialAccountPassword) {
      return verifyAccountPassword(parameters.authenticationValue);
    } else if(parameters.name == PrivilegesManager.CredentialLocalPasscode) {
      return verifyLocalPasscode(parameters.authenticationValue);
    }
  }

}

angular.module('app').service('privilegesManager', PrivilegesManager);

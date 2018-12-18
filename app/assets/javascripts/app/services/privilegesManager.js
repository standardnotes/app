class PrivilegesManager {

  constructor(passcodeManager, authManager, singletonManager, modelManager, storageManager, $rootScope, $compile) {
    this.passcodeManager = passcodeManager;
    this.authManager = authManager;
    this.singletonManager = singletonManager;
    this.modelManager = modelManager;
    this.storageManager = storageManager;
    this.$rootScope = $rootScope;
    this.$compile = $compile;

    this.loadPrivileges();

    PrivilegesManager.CredentialAccountPassword = "CredentialAccountPassword";
    PrivilegesManager.CredentialLocalPasscode = "CredentialLocalPasscode";

    PrivilegesManager.ActionManageExtensions = "ActionManageExtensions";
    PrivilegesManager.ActionManageBackups = "ActionManageBackups";
    PrivilegesManager.ActionViewProtectedNotes = "ActionViewProtectedNotes";
    PrivilegesManager.ActionManagePrivileges = "ActionManagePrivileges";
    PrivilegesManager.ActionManagePasscode = "ActionManagePasscode";
    PrivilegesManager.ActionDeleteNote = "ActionDeleteNote";

    PrivilegesManager.SessionExpiresAtKey = "SessionExpiresAtKey";
    PrivilegesManager.SessionLengthKey = "SessionLengthKey";

    PrivilegesManager.SessionLengthNone = 0;
    PrivilegesManager.SessionLengthFiveMinutes = 300;
    PrivilegesManager.SessionLengthOneHour = 3600;
    PrivilegesManager.SessionLengthOneWeek = 604800;

    this.availableActions = [
      PrivilegesManager.ActionViewProtectedNotes,
      PrivilegesManager.ActionDeleteNote,
      PrivilegesManager.ActionManagePasscode,
      PrivilegesManager.ActionManageBackups,
      PrivilegesManager.ActionManageExtensions,
      PrivilegesManager.ActionManagePrivileges,
    ]

    this.availableCredentials = [
      PrivilegesManager.CredentialAccountPassword,
      PrivilegesManager.CredentialLocalPasscode
    ];

    this.sessionLengths = [
      PrivilegesManager.SessionLengthNone,
      PrivilegesManager.SessionLengthFiveMinutes,
      PrivilegesManager.SessionLengthOneHour,
      PrivilegesManager.SessionLengthOneWeek,
      PrivilegesManager.SessionLengthIndefinite
    ]
  }

  getAvailableActions() {
    return this.availableActions;
  }

  getAvailableCredentials() {
    return this.availableCredentials;
  }

  presentPrivilegesModal(action, onSuccess, onCancel) {
    if(this.authenticationInProgress()) {
      onCancel && onCancel();
      return;
    }

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
    var el = this.$compile( "<privileges-auth-modal action='action' on-success='onSuccess' on-cancel='onCancel' class='sk-modal'></privileges-auth-modal>" )(scope);
    angular.element(document.body).append(el);

    this.currentAuthenticationElement = el;
  }

  async netCredentialsForAction(action) {
    let credentials = (await this.getPrivileges()).getCredentialsForAction(action);
    let netCredentials = [];

    for(var cred of credentials) {
      if(cred == PrivilegesManager.CredentialAccountPassword) {
        if(!this.authManager.offline()) {
          netCredentials.push(cred);
        }
      } else if(cred == PrivilegesManager.CredentialLocalPasscode) {
        if(this.passcodeManager.hasPasscode()) {
          netCredentials.push(cred);
        }
      }
    }

    return netCredentials;
  }

  presentPrivilegesManagementModal() {
    var scope = this.$rootScope.$new(true);
    var el = this.$compile( "<privileges-management-modal class='sk-modal'></privileges-management-modal>")(scope);
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
          this.privileges.content.desktopPrivileges = {};
        }
        resolve(resolvedSingleton);
      }, (valueCallback) => {
        // Safe to create. Create and return object.
        var privs = new SNPrivileges({content_type: prefsContentType});
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
    };

    metadata[PrivilegesManager.ActionManageBackups] = {
      label: "Download/Import Backups"
    };

    metadata[PrivilegesManager.ActionViewProtectedNotes] = {
      label: "View Protected Notes"
    };

    metadata[PrivilegesManager.ActionManagePrivileges] = {
      label: "Manage Privileges"
    };

    metadata[PrivilegesManager.ActionManagePasscode] = {
      label: "Manage Passcode"
    }

    metadata[PrivilegesManager.ActionDeleteNote] = {
      label: "Delete Notes"
    }

    return metadata[action];
  }

  getSessionLengthOptions() {
    return [
      {
        value: PrivilegesManager.SessionLengthNone,
        label: "Don't Remember"
      },
      {
        value: PrivilegesManager.SessionLengthFiveMinutes,
        label: "5 Minutes"
      },
      {
        value: PrivilegesManager.SessionLengthOneHour,
        label: "1 Hour"
      },
      {
        value: PrivilegesManager.SessionLengthOneWeek,
        label: "1 Week"
      }
    ]
  }

  async setSessionLength(length) {
    let addToNow = (seconds) => {
      let date = new Date();
      date.setSeconds(date.getSeconds() + seconds);
      return date;
    }

    let expiresAt = addToNow(length);

    return Promise.all([
      this.storageManager.setItem(PrivilegesManager.SessionExpiresAtKey, JSON.stringify(expiresAt), this.storageManager.bestStorageMode()),
      this.storageManager.setItem(PrivilegesManager.SessionLengthKey, JSON.stringify(length), this.storageManager.bestStorageMode()),
    ])
  }

  async clearSession() {
    return this.setSessionLength(PrivilegesManager.SessionLengthNone);
  }

  async getSelectedSessionLength() {
    let length = await this.storageManager.getItem(PrivilegesManager.SessionLengthKey, this.storageManager.bestStorageMode());
    if(length) {
      return JSON.parse(length);
    } else {
      return PrivilegesManager.SessionLengthNone;
    }
  }

  async getSessionExpirey() {
    let expiresAt = await this.storageManager.getItem(PrivilegesManager.SessionExpiresAtKey, this.storageManager.bestStorageMode());
    if(expiresAt) {
      return new Date(JSON.parse(expiresAt));
    } else {
      return new Date();
    }
  }

  async actionHasPrivilegesConfigured(action) {
    return (await this.netCredentialsForAction(action)).length > 0;
  }

  async actionRequiresPrivilege(action) {
    let expiresAt = await this.getSessionExpirey();
    if(expiresAt > new Date()) {
      return false;
    }
    return (await this.netCredentialsForAction(action)).length > 0;
  }

  async savePrivileges() {
    let privs = await this.getPrivileges();
    privs.setDirty(true);
    this.$rootScope.sync();
  }

  async authenticateAction(action, credentialAuthMapping) {
    var requiredCredentials = (await this.netCredentialsForAction(action));
    var successfulCredentials = [], failedCredentials = [];

    for(let requiredCredential of requiredCredentials) {
      var passesAuth = await this._verifyAuthenticationParameters(requiredCredential, credentialAuthMapping[requiredCredential]);
      if(passesAuth) {
        successfulCredentials.push(requiredCredential);
      } else {
        failedCredentials.push(requiredCredential);
      }
    }

    return {
      success: failedCredentials.length == 0,
      successfulCredentials: successfulCredentials,
      failedCredentials: failedCredentials
    }
  }

  async _verifyAuthenticationParameters(credential, value) {

    let verifyAccountPassword = async (password) => {
      return this.authManager.verifyAccountPassword(password);
    }

    let verifyLocalPasscode = async (passcode) => {
      return this.passcodeManager.verifyPasscode(passcode);
    }

    if(credential == PrivilegesManager.CredentialAccountPassword) {
      return verifyAccountPassword(value);
    } else if(credential == PrivilegesManager.CredentialLocalPasscode) {
      return verifyLocalPasscode(value);
    }
  }

}

angular.module('app').service('privilegesManager', PrivilegesManager);

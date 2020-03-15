import { isDesktopApplication, isNullOrUndefined } from '@/utils';
import template from '%/directives/account-menu.pug';
import { ProtectedActions } from 'snjs';
import { PureCtrl } from '@Controllers';
import {
  STRING_ACCOUNT_MENU_UNCHECK_MERGE,
  STRING_SIGN_OUT_CONFIRMATION,
  STRING_E2E_ENABLED,
  STRING_LOCAL_ENC_ENABLED,
  STRING_ENC_NOT_ENABLED,
  STRING_IMPORT_SUCCESS,
  STRING_REMOVE_PASSCODE_CONFIRMATION,
  STRING_REMOVE_PASSCODE_OFFLINE_ADDENDUM,
  STRING_NON_MATCHING_PASSCODES,
  STRING_NON_MATCHING_PASSWORDS,
  STRING_INVALID_IMPORT_FILE,
  STRING_GENERATING_LOGIN_KEYS,
  STRING_GENERATING_REGISTER_KEYS,
  StringImportError
} from '@/strings';

const ELEMENT_ID_IMPORT_PASSWORD_INPUT = 'import-password-request';

const ELEMENT_NAME_AUTH_EMAIL = 'email';
const ELEMENT_NAME_AUTH_PASSWORD = 'password';
const ELEMENT_NAME_AUTH_PASSWORD_CONF = 'password_conf';

class AccountMenuCtrl extends PureCtrl {
  /* @ngInject */
  constructor(
    $scope,
    $rootScope,
    $timeout,
    appVersion,
    application,
    appState,
    archiveManager,
    godService,
    lockManager,
  ) {
    super($scope, $timeout, application, appState);
    this.$rootScope = $rootScope;
    this.appState = appState;
    this.application = application;
    this.archiveManager = archiveManager;
    this.godService = godService;
    this.lockManager = lockManager;

    this.state = {
      appVersion: 'v' + (window.electronAppVersion || appVersion),
      passcodeAutoLockOptions: this.lockManager.getAutoLockIntervalOptions(),
      user: this.application.getUser(),
      formData: {
        mergeLocal: true,
        ephemeral: false
      },
      mutable: {}
    };
    this.syncStatus = this.application.getSyncStatus();
  }

  async onAppKeyChange() {
    super.onAppKeyChange();
    this.setState(this.refreshedCredentialState());
  }

  async onAppLaunch() {
    super.onAppLaunch();
    this.setState(this.refreshedCredentialState());
    this.loadHost();
    this.reloadAutoLockInterval();
    this.loadBackupsAvailability();
  }

  refreshedCredentialState() {
    return {
      user: this.application.getUser(),
      canAddPasscode: !this.application.isEphemeralSession(),
      hasPasscode: this.application.hasPasscode(),
      showPasscodeForm: false
    };
  }

  $onInit() {
    super.$onInit();
    this.initProps({
      closeFunction: this.closeFunction
    });
  }

  close() {
    this.$timeout(() => {
      this.props.closeFunction()();
    });
  }

  async loadHost() {
    const host = await this.application.getHost();
    this.setState({
      server: host,
      formData: {
        ...this.state.formData,
        url: host
      }
    });
  }

  async loadBackupsAvailability() {
    const hasUser = !isNullOrUndefined(this.application.getUser());
    const hasPasscode = this.application.hasPasscode();
    const encryptedAvailable = hasUser || hasPasscode;

    function encryptionStatusString() {
      if (hasUser) {
        return STRING_E2E_ENABLED;
      } else if (hasPasscode) {
        return STRING_LOCAL_ENC_ENABLED;
      } else {
        return STRING_ENC_NOT_ENABLED;
      }
    }

    this.setState({
      encryptionStatusString: encryptionStatusString(),
      encryptionEnabled: encryptedAvailable,
      mutable: {
        ...this.state.mutable,
        backupEncrypted: encryptedAvailable
      }
    });
  }

  submitMfaForm() {
    this.login();
  }

  blurAuthFields() {
    const names = [
      ELEMENT_NAME_AUTH_EMAIL,
      ELEMENT_NAME_AUTH_PASSWORD,
      ELEMENT_NAME_AUTH_PASSWORD_CONF
    ];
    for (const name of names) {
      const element = document.getElementsByName(name)[0];
      if (element) {
        element.blur();
      }
    }
  }

  submitAuthForm() {
    if (!this.state.formData.email || !this.state.formData.user_password) {
      return;
    }
    this.blurAuthFields();
    if (this.state.formData.showLogin) {
      this.login();
    } else {
      this.register();
    }
  }

  async setFormDataState(formData) {
    return this.setState({
      formData: {
        ...this.state.formData,
        ...formData
      }
    });
  }

  async login() {
    await this.setFormDataState({
      status: STRING_GENERATING_LOGIN_KEYS,
      authenticating: true
    });
    const response = await this.application.signIn({
      email: this.state.formData.email,
      password: this.state.formData.user_password,
      strict: this.state.formData.strictSignin,
      ephemeral: this.state.formData.ephemeral,
      mfaKeyPath: this.state.formData.mfa && this.state.formData.mfa.payload.mfa_key,
      mfaCode: this.state.formData.userMfaCode,
      mergeLocal: this.state.formData.mergeLocal
    });
    const hasError = !response || response.error;
    if (!hasError) {
      await this.setFormDataState({ authenticating: false });
      this.close();
      return;
    }
    await this.setFormDataState({
      status: null,
      user_password: null
    });
    const error = response
      ? response.error
      : { message: "An unknown error occured." };

    if (error.tag === 'mfa-required' || error.tag === 'mfa-invalid') {
      await this.setFormDataState({
        showLogin: false,
        mfa: error
      });
    } else {
      await this.setFormDataState({
        showLogin: true,
        mfa: null
      });
      if (error.message) {
        this.application.alertService.alert({
          text: error.message
        });
      }
    }
    await this.setFormDataState({
      authenticating: false
    });
  }

  async register() {
    const confirmation = this.state.formData.password_conf;
    if (confirmation !== this.state.formData.user_password) {
      this.application.alertService.alert({
        text: STRING_NON_MATCHING_PASSWORDS
      });
      return;
    }
    await this.setFormDataState({
      confirmPassword: false,
      status: STRING_GENERATING_REGISTER_KEYS,
      authenticating: true
    });
    const response = await this.application.register({
      email: this.state.formData.email,
      password: this.state.formData.user_password,
      ephemeral: this.state.formData.ephemeral,
      mergeLocal: this.state.formData.mergeLocal
    });
    if (!response || response.error) {
      await this.setFormDataState({
        status: null
      });
      const error = response
        ? response.error
        : { message: "An unknown error occured." };
      await this.setFormDataState({
        authenticating: false
      });
      this.application.alertService.alert({
        text: error.message
      });
    } else {
      await this.setFormDataState({ authenticating: false });
      this.close();
    }
  }

  mergeLocalChanged() {
    if (!this.state.formData.mergeLocal) {
      this.application.alertService.confirm({
        text: STRING_ACCOUNT_MENU_UNCHECK_MERGE,
        destructive: true,
        onCancel: () => {
          this.setFormDataState({
            mergeLocal: true
          });
        }
      });
    }
  }

  openPasswordWizard() {
    this.close();
    this.godService.presentPasswordWizard();
  }

  async openPrivilegesModal() {
    this.close();
    const run = () => {
      this.godService.presentPrivilegesManagementModal();
    };
    const needsPrivilege = await this.application.privilegesService.actionRequiresPrivilege(
      ProtectedActions.ManagePrivileges
    );
    if (needsPrivilege) {
      this.godService.presentPrivilegesModal(
        ProtectedActions.ManagePrivileges,
        () => {
          run();
        }
      );
    } else {
      run();
    }
  }

  destroyLocalData() {
    this.application.alertService.confirm({
      text: STRING_SIGN_OUT_CONFIRMATION,
      destructive: true,
      onConfirm: async () => {
        await this.application.signOut();
      }
    });
  }

  async submitImportPassword() {
    await this.performImport(
      this.state.importData.data,
      this.state.importData.password
    );
  }

  async readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const data = JSON.parse(e.target.result);
          resolve(data);
        } catch (e) {
          this.application.alertService.alert({
            text: STRING_INVALID_IMPORT_FILE
          });
        }
      };
      reader.readAsText(file);
    });
  }

  /**
   * @template 
   */
  async importFileSelected(files) {
    const run = async () => {
      const file = files[0];
      const data = await this.readFile(file);
      if (!data) {
        return;
      }
      if (data.auth_params) {
        await this.setState({
          importData: {
            ...this.state.importData,
            requestPassword: true,
            data: data
          }
        });
        const element = document.getElementById(
          ELEMENT_ID_IMPORT_PASSWORD_INPUT
        );
        if (element) {
          element.scrollIntoView(false);
        }
      } else {
        await this.performImport(data, null);
      }
    };
    const needsPrivilege = await this.application.privilegesService.actionRequiresPrivilege(
      ProtectedActions.ManageBackups
    );
    if (needsPrivilege) {
      this.godService.presentPrivilegesModal(
        ProtectedActions.ManageBackups,
        run
      );
    } else {
      run();
    }
  }

  async performImport(data, password) {
    await this.setState({
      importData: {
        ...this.state.importData,
        loading: true
      }
    });
    const errorCount = await this.importJSONData(data, password);
    this.setState({
      importData: null
    });
    if (errorCount > 0) {
      const message = StringImportError({ errorCount: errorCount });
      this.application.alertService.alert({
        text: message
      });
    } else {
      this.application.alertService.alert({
        text: STRING_IMPORT_SUCCESS
      });
    }
  }

  async importJSONData(data, password) {
    const { affectedItems, errorCount } = await this.application.importData({
      data: data.items,
      password: password
    });
    for (const item of affectedItems) {
      /**
       * Don't want to activate any components during import process in
       * case of exceptions breaking up the import proccess
       */
      if (item.content_type === 'SN|Component') {
        item.active = false;
      }
    }
    return errorCount;
  }

  async downloadDataArchive() {
    this.archiveManager.downloadBackup(this.state.mutable.backupEncrypted);
  }

  notesAndTagsCount() {
    return this.application.getItems({
      contentType: [
        'Note',
        'Tag'
      ]
    }).length;
  }

  encryptionStatusForNotes() {
    const length = this.notesAndTagsCount();
    return length + "/" + length + " notes and tags encrypted";
  }

  async reloadAutoLockInterval() {
    const interval = await this.lockManager.getAutoLockInterval();
    this.setState({
      selectedAutoLockInterval: interval
    });
  }

  async selectAutoLockInterval(interval) {
    const run = async () => {
      await this.lockManager.setAutoLockInterval(interval);
      this.reloadAutoLockInterval();
    };
    const needsPrivilege = await this.application.privilegesService.actionRequiresPrivilege(
      ProtectedActions.ManagePasscode
    );
    if (needsPrivilege) {
      this.godService.presentPrivilegesModal(
        ProtectedActions.ManagePasscode,
        () => {
          run();
        }
      );
    } else {
      run();
    }
  }

  hidePasswordForm() {
    this.setFormDataState({
      showLogin: false,
      showRegister: false,
      user_password: null,
      password_conf: null
    });
  }

  hasPasscode() {
    return this.passcodeManager.hasPasscode();
  }

  addPasscodeClicked() {
    this.setFormDataState({
      showPasscodeForm: true
    });
  }

  submitPasscodeForm() {
    const passcode = this.state.formData.passcode;
    if (passcode !== this.state.formData.confirmPasscode) {
      this.application.alertService.alert({
        text: STRING_NON_MATCHING_PASSCODES
      });
      return;
    }
    (this.state.formData.changingPasscode
      ? this.application.changePasscode(passcode)
      : this.application.setPasscode(passcode)
    ).then(() => {
      this.setFormDataState({
        passcode: null,
        confirmPasscode: null,
        showPasscodeForm: false
      });
    });
  }

  async changePasscodePressed() {
    const run = () => {
      this.state.formData.changingPasscode = true;
      this.addPasscodeClicked();
    };
    const needsPrivilege = await this.application.privilegesService.actionRequiresPrivilege(
      ProtectedActions.ManagePasscode
    );
    if (needsPrivilege) {
      this.godService.presentPrivilegesModal(
        ProtectedActions.ManagePasscode,
        run
      );
    } else {
      run();
    }
  }

  async removePasscodePressed() {
    const run = async () => {
      const signedIn = !isNullOrUndefined(await this.application.getUser());
      let message = STRING_REMOVE_PASSCODE_CONFIRMATION;
      if (!signedIn) {
        message += STRING_REMOVE_PASSCODE_OFFLINE_ADDENDUM;
      }
      this.application.alertService.confirm({
        text: message,
        destructive: true,
        onConfirm: () => {
          this.application.removePasscode();
        }
      });
    };
    const needsPrivilege = await this.application.privilegesService.actionRequiresPrivilege(
      ProtectedActions.ManagePasscode
    );
    if (needsPrivilege) {
      this.godService.presentPrivilegesModal(
        ProtectedActions.ManagePasscode,
        run
      );
    } else {
      run();
    }
  }

  isDesktopApplication() {
    return isDesktopApplication();
  }
}

export class AccountMenu {
  constructor() {
    this.restrict = 'E';
    this.template = template;
    this.controller = AccountMenuCtrl;
    this.controllerAs = 'self';
    this.bindToController = true;
    this.scope = {
      closeFunction: '&'
    };
  }
}

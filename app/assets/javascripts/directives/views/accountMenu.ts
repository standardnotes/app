import { WebDirective } from './../../types';
import { isDesktopApplication, isSameDay, preventRefreshing } from '@/utils';
import template from '%/directives/account-menu.pug';
import { PureViewCtrl } from '@Views/abstract/pure_view_ctrl';
import {
  STRING_ACCOUNT_MENU_UNCHECK_MERGE,
  STRING_SIGN_OUT_CONFIRMATION,
  STRING_E2E_ENABLED,
  STRING_LOCAL_ENC_ENABLED,
  STRING_ENC_NOT_ENABLED,
  STRING_IMPORT_SUCCESS,
  STRING_NON_MATCHING_PASSCODES,
  STRING_NON_MATCHING_PASSWORDS,
  STRING_INVALID_IMPORT_FILE,
  STRING_GENERATING_LOGIN_KEYS,
  STRING_GENERATING_REGISTER_KEYS,
  StringImportError,
  STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_CHANGE,
  STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_REMOVAL,
  STRING_UNSUPPORTED_BACKUP_FILE_VERSION,
  Strings,
} from '@/strings';
import { PasswordWizardType } from '@/types';
import {
  ApplicationEvent,
  BackupFile,
  ContentType,
  Platform,
} from '@standardnotes/snjs';
import { confirmDialog, alertDialog } from '@/services/alertService';
import { autorun, IReactionDisposer } from 'mobx';
import { storage, StorageKey } from '@/services/localStorage';
import {
  disableErrorReporting,
  enableErrorReporting,
  errorReportingId,
} from '@/services/errorReporting';

const ELEMENT_NAME_AUTH_EMAIL = 'email';
const ELEMENT_NAME_AUTH_PASSWORD = 'password';
const ELEMENT_NAME_AUTH_PASSWORD_CONF = 'password_conf';

type FormData = {
  email: string;
  user_password: string;
  password_conf: string;
  confirmPassword: boolean;
  showLogin: boolean;
  showRegister: boolean;
  showPasscodeForm: boolean;
  strictSignin?: boolean;
  ephemeral: boolean;
  mergeLocal?: boolean;
  url: string;
  authenticating: boolean;
  status: string;
  passcode: string;
  confirmPasscode: string;
  changingPasscode: boolean;
};

type AccountMenuState = {
  formData: Partial<FormData>;
  appVersion: string;
  passcodeAutoLockOptions: any;
  user: any;
  mutable: any;
  importData: any;
  encryptionStatusString?: string;
  server?: string;
  encryptionEnabled?: boolean;
  selectedAutoLockInterval?: unknown;
  showBetaWarning: boolean;
  errorReportingEnabled: boolean;
  syncInProgress: boolean;
  syncError?: string;
  showSessions: boolean;
  errorReportingId: string | null;
  keyStorageInfo: string | null;
  protectionsDisabledUntil: string | null;
};

class AccountMenuCtrl extends PureViewCtrl<unknown, AccountMenuState> {
  public appVersion: string;
  /** @template */
  private closeFunction?: () => void;
  private removeBetaWarningListener?: IReactionDisposer;
  private removeSyncObserver?: IReactionDisposer;
  private removeProtectionLengthObserver?: () => void;

  public passcodeInput!: JQLite;

  /* @ngInject */
  constructor($timeout: ng.ITimeoutService, appVersion: string) {
    super($timeout);
    this.appVersion = appVersion;
  }

  /** @override */
  getInitialState() {
    return {
      appVersion: 'v' + ((window as any).electronAppVersion || this.appVersion),
      passcodeAutoLockOptions: this.application
        .getAutolockService()
        .getAutoLockIntervalOptions(),
      user: this.application.getUser(),
      formData: {
        mergeLocal: true,
        ephemeral: false,
      },
      mutable: {},
      showBetaWarning: false,
      errorReportingEnabled:
        storage.get(StorageKey.DisableErrorReporting) === false,
      showSessions: false,
      errorReportingId: errorReportingId(),
      keyStorageInfo: Strings.keyStorageInfo(this.application),
      importData: null,
      syncInProgress: false,
      protectionsDisabledUntil: this.getProtectionsDisabledUntil(),
    };
  }

  getState() {
    return this.state as AccountMenuState;
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
    this.refreshEncryptionStatus();
  }

  refreshedCredentialState() {
    return {
      user: this.application.getUser(),
      canAddPasscode: !this.application.isEphemeralSession(),
      hasPasscode: this.application.hasPasscode(),
      showPasscodeForm: false,
    };
  }

  async $onInit() {
    super.$onInit();
    this.setState({
      showSessions: await this.application.userCanManageSessions(),
    });

    const sync = this.appState.sync;
    this.removeSyncObserver = autorun(() => {
      this.setState({
        syncInProgress: sync.inProgress,
        syncError: sync.errorMessage,
      });
    });
    this.removeBetaWarningListener = autorun(() => {
      this.setState({
        showBetaWarning: this.appState.showBetaWarning,
      });
    });

    this.removeProtectionLengthObserver = this.application.addEventObserver(
      async () => {
        this.setState({
          protectionsDisabledUntil: this.getProtectionsDisabledUntil(),
        });
      },
      ApplicationEvent.ProtectionSessionExpiryDateChanged
    );
  }

  deinit() {
    this.removeSyncObserver?.();
    this.removeBetaWarningListener?.();
    this.removeProtectionLengthObserver?.();
    super.deinit();
  }

  close() {
    this.$timeout(() => {
      this.closeFunction?.();
    });
  }

  hasProtections() {
    return this.application.hasProtectionSources();
  }

  private getProtectionsDisabledUntil(): string | null {
    const protectionExpiry = this.application.getProtectionSessionExpiryDate();
    const now = new Date();
    if (protectionExpiry > now) {
      let f: Intl.DateTimeFormat;
      if (isSameDay(protectionExpiry, now)) {
        f = new Intl.DateTimeFormat(undefined, {
          hour: 'numeric',
          minute: 'numeric',
        });
      } else {
        f = new Intl.DateTimeFormat(undefined, {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          hour: 'numeric',
          minute: 'numeric',
        });
      }

      return f.format(protectionExpiry);
    }
    return null;
  }

  async loadHost() {
    const host = await this.application.getHost();
    this.setState({
      server: host,
      formData: {
        ...this.getState().formData,
        url: host,
      },
    });
  }

  enableProtections() {
    this.application.clearProtectionSession();
  }

  onHostInputChange() {
    const url = this.getState().formData.url!;
    this.application!.setHost(url);
  }

  refreshEncryptionStatus() {
    const hasUser = this.application!.hasAccount();
    const hasPasscode = this.application!.hasPasscode();
    const encryptionEnabled = hasUser || hasPasscode;

    this.setState({
      encryptionStatusString: hasUser
        ? STRING_E2E_ENABLED
        : hasPasscode
        ? STRING_LOCAL_ENC_ENABLED
        : STRING_ENC_NOT_ENABLED,
      encryptionEnabled,
      mutable: {
        ...this.getState().mutable,
        backupEncrypted: encryptionEnabled,
      },
    });
  }

  submitMfaForm() {
    this.login();
  }

  blurAuthFields() {
    const names = [
      ELEMENT_NAME_AUTH_EMAIL,
      ELEMENT_NAME_AUTH_PASSWORD,
      ELEMENT_NAME_AUTH_PASSWORD_CONF,
    ];
    for (const name of names) {
      const element = document.getElementsByName(name)[0];
      if (element) {
        element.blur();
      }
    }
  }

  submitAuthForm() {
    if (
      !this.getState().formData.email ||
      !this.getState().formData.user_password
    ) {
      return;
    }
    this.blurAuthFields();
    if (this.getState().formData.showLogin) {
      this.login();
    } else {
      this.register();
    }
  }

  async setFormDataState(formData: Partial<FormData>) {
    return this.setState({
      formData: {
        ...this.getState().formData,
        ...formData,
      },
    });
  }

  async login() {
    await this.setFormDataState({
      status: STRING_GENERATING_LOGIN_KEYS,
      authenticating: true,
    });
    const formData = this.getState().formData;
    const response = await this.application!.signIn(
      formData.email!,
      formData.user_password!,
      formData.strictSignin,
      formData.ephemeral,
      formData.mergeLocal
    );
    const error = response.error;
    if (!error) {
      await this.setFormDataState({
        authenticating: false,
        user_password: undefined,
      });
      this.close();
      return;
    }
    await this.setFormDataState({
      showLogin: true,
      status: undefined,
      user_password: undefined,
    });
    if (error.message) {
      this.application!.alertService!.alert(error.message);
    }
    await this.setFormDataState({
      authenticating: false,
    });
  }

  async register() {
    const confirmation = this.getState().formData.password_conf;
    if (confirmation !== this.getState().formData.user_password) {
      this.application!.alertService!.alert(STRING_NON_MATCHING_PASSWORDS);
      return;
    }
    await this.setFormDataState({
      confirmPassword: false,
      status: STRING_GENERATING_REGISTER_KEYS,
      authenticating: true,
    });
    const response = await this.application!.register(
      this.getState().formData.email!,
      this.getState().formData.user_password!,
      this.getState().formData.ephemeral,
      this.getState().formData.mergeLocal
    );
    const error = response.error;
    if (error) {
      await this.setFormDataState({
        status: undefined,
      });
      await this.setFormDataState({
        authenticating: false,
      });
      this.application!.alertService!.alert(error.message);
    } else {
      await this.setFormDataState({ authenticating: false });
      this.close();
    }
  }

  async mergeLocalChanged() {
    if (!this.getState().formData.mergeLocal) {
      this.setFormDataState({
        mergeLocal: !(await confirmDialog({
          text: STRING_ACCOUNT_MENU_UNCHECK_MERGE,
          confirmButtonStyle: 'danger',
        })),
      });
    }
  }

  openPasswordWizard() {
    this.close();
    this.application!.presentPasswordWizard(PasswordWizardType.ChangePassword);
  }

  openSessionsModal() {
    this.close();
    this.appState.openSessionsModal();
  }

  signOut() {
    this.appState.accountMenu.setSigningOut(true);
  }

  showRegister() {
    this.setFormDataState({
      showRegister: true,
    });
  }

  async readFile(file: File): Promise<any> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target!.result as string);
          resolve(data);
        } catch (e) {
          this.application!.alertService!.alert(STRING_INVALID_IMPORT_FILE);
        }
      };
      reader.readAsText(file);
    });
  }

  /**
   * @template
   */
  async importFileSelected(files: File[]) {
    const file = files[0];
    const data = await this.readFile(file);
    if (!data) {
      return;
    }
    if (data.version || data.auth_params || data.keyParams) {
      const version =
        data.version || data.keyParams?.version || data.auth_params?.version;
      if (
        this.application.protocolService.supportedVersions().includes(version)
      ) {
        await this.performImport(data);
      } else {
        await this.setState({ importData: null });
        void alertDialog({ text: STRING_UNSUPPORTED_BACKUP_FILE_VERSION });
      }
    } else {
      await this.performImport(data);
    }
  }

  async performImport(data: BackupFile) {
    await this.setState({
      importData: {
        ...this.getState().importData,
        loading: true,
      },
    });
    const result = await this.application.importData(data);
    this.setState({
      importData: null,
    });
    if (!result) {
      return;
    } else if ('error' in result) {
      void alertDialog({
        text: result.error,
      });
    } else if (result.errorCount) {
      void alertDialog({
        text: StringImportError(result.errorCount),
      });
    } else {
      void alertDialog({
        text: STRING_IMPORT_SUCCESS,
      });
    }
  }

  async downloadDataArchive() {
    this.application
      .getArchiveService()
      .downloadBackup(this.getState().mutable.backupEncrypted);
  }

  notesAndTagsCount() {
    return this.application.getItems([ContentType.Note, ContentType.Tag])
      .length;
  }

  encryptionStatusForNotes() {
    const length = this.notesAndTagsCount();
    return length + '/' + length + ' notes and tags encrypted';
  }

  async reloadAutoLockInterval() {
    const interval = await this.application!.getAutolockService().getAutoLockInterval();
    this.setState({
      selectedAutoLockInterval: interval,
    });
  }

  async selectAutoLockInterval(interval: number) {
    if (!(await this.application.authorizeAutolockIntervalChange())) {
      return;
    }
    await this.application!.getAutolockService().setAutoLockInterval(interval);
    this.reloadAutoLockInterval();
  }

  hidePasswordForm() {
    this.setFormDataState({
      showLogin: false,
      showRegister: false,
      user_password: undefined,
      password_conf: undefined,
    });
  }

  hasPasscode() {
    return this.application!.hasPasscode();
  }

  addPasscodeClicked() {
    this.setFormDataState({
      showPasscodeForm: true,
    });
  }

  async submitPasscodeForm() {
    const passcode = this.getState().formData.passcode!;
    if (passcode !== this.getState().formData.confirmPasscode!) {
      await alertDialog({
        text: STRING_NON_MATCHING_PASSCODES,
      });
      this.passcodeInput[0].focus();
      return;
    }

    await preventRefreshing(
      STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_CHANGE,
      async () => {
        const successful = this.application.hasPasscode()
          ? await this.application.changePasscode(passcode)
          : await this.application.addPasscode(passcode);
        if (!successful) {
          this.passcodeInput[0].focus();
        }
      }
    );
    this.setFormDataState({
      passcode: undefined,
      confirmPasscode: undefined,
      showPasscodeForm: false,
    });
    this.refreshEncryptionStatus();
  }

  async changePasscodePressed() {
    this.getState().formData.changingPasscode = true;
    this.addPasscodeClicked();
  }

  async removePasscodePressed() {
    await preventRefreshing(
      STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_REMOVAL,
      async () => {
        if (await this.application!.removePasscode()) {
          await this.application
            .getAutolockService()
            .deleteAutolockPreference();
          await this.reloadAutoLockInterval();
          this.refreshEncryptionStatus();
        }
      }
    );
  }

  openErrorReportingDialog() {
    alertDialog({
      title: 'Data sent during automatic error reporting',
      text: `
        We use <a target="_blank" rel="noreferrer" href="https://www.bugsnag.com/">Bugsnag</a>
        to automatically report errors that occur while the app is running. See
        <a target="_blank" rel="noreferrer" href="https://docs.bugsnag.com/platforms/javascript/#sending-diagnostic-data">
          this article, paragraph 'Browser' under 'Sending diagnostic data',
        </a>
        to see what data is included in error reports.
        <br><br>
        Error reports never include IP addresses and are fully
        anonymized. We use error reports to be alerted when something in our
        code is causing unexpected errors and crashes in your application
        experience.
      `,
    });
  }

  toggleErrorReportingEnabled() {
    if (this.state.errorReportingEnabled) {
      disableErrorReporting();
    } else {
      enableErrorReporting();
    }
    if (!this.state.syncInProgress) {
      window.location.reload();
    }
  }

  isDesktopApplication() {
    return isDesktopApplication();
  }
}

export class AccountMenu extends WebDirective {
  constructor() {
    super();
    this.restrict = 'E';
    this.template = template;
    this.controller = AccountMenuCtrl;
    this.controllerAs = 'self';
    this.bindToController = true;
    this.scope = {
      closeFunction: '&',
      application: '=',
    };
  }
}

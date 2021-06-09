import { observer } from 'mobx-react-lite';
import { toDirective } from '@/components/utils';
import { AppState } from '@/ui_models/app_state';
import { WebApplication } from '@/ui_models/application';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import { isDesktopApplication, isSameDay, preventRefreshing } from '@/utils';
import { storage, StorageKey } from '@Services/localStorage';
import { disableErrorReporting, enableErrorReporting, errorReportingId } from '@Services/errorReporting';
import {
  STRING_ACCOUNT_MENU_UNCHECK_MERGE,
  STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_CHANGE,
  STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_REMOVAL,
  STRING_E2E_ENABLED,
  STRING_ENC_NOT_ENABLED,
  STRING_GENERATING_LOGIN_KEYS,
  STRING_GENERATING_REGISTER_KEYS,
  STRING_IMPORT_SUCCESS,
  STRING_INVALID_IMPORT_FILE,
  STRING_LOCAL_ENC_ENABLED,
  STRING_NON_MATCHING_PASSCODES,
  STRING_NON_MATCHING_PASSWORDS,
  STRING_UNSUPPORTED_BACKUP_FILE_VERSION,
  StringImportError,
  StringUtils
} from '@/strings';
import { ApplicationEvent, BackupFile } from '@node_modules/@standardnotes/snjs';
import { PasswordWizardType } from '@/types';
import { JSXInternal } from '@node_modules/preact/src/jsx';
import TargetedEvent = JSXInternal.TargetedEvent;
import TargetedKeyboardEvent = JSXInternal.TargetedKeyboardEvent;
import TargetedMouseEvent = JSXInternal.TargetedMouseEvent;
import { alertDialog, confirmDialog } from '@Services/alertService';
import { ConfirmSignoutContainer } from '@/components/ConfirmSignoutModal';

type Props = {
  appState: AppState;
  application: WebApplication;
};

const AccountMenu = observer(({ application, appState }: Props) => {
  const getProtectionsDisabledUntil = (): string | null => {
    const protectionExpiry = application.getProtectionSessionExpiryDate();
    const now = new Date();
    if (protectionExpiry > now) {
      let f: Intl.DateTimeFormat;
      if (isSameDay(protectionExpiry, now)) {
        f = new Intl.DateTimeFormat(undefined, {
          hour: 'numeric',
          minute: 'numeric'
        });
      } else {
        f = new Intl.DateTimeFormat(undefined, {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          hour: 'numeric',
          minute: 'numeric'
        });
      }

      return f.format(protectionExpiry);
    }
    return null;
  };

  const passcodeInputRef = useRef<HTMLInputElement>();
  const emailInputRef = useRef<HTMLInputElement>();
  const passwordInputRef = useRef<HTMLInputElement>();
  const passwordConfirmationInputRef = useRef<HTMLInputElement>();

  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);

  const [isEphemeral, setIsEphemeral] = useState(false);
  const [isStrictSignIn, setIsStrictSignIn] = useState(false);

  const [passcode, setPasscode] = useState<string | undefined>(undefined);
  const [passcodeConfirmation, setPasscodeConfirmation] = useState<string | undefined>(undefined);

  const [encryptionStatusString, setEncryptionStatusString] = useState<string | undefined>(undefined);
  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(false);
  const [shouldMergeLocal, setShouldMergeLocal] = useState(true);

  const [server, setServer] = useState<string | undefined>(application.getHost());
  const [url, setUrl] = useState<string | undefined>(application.getHost());
  const [showPasscodeForm, setShowPasscodeForm] = useState(false);
  const [selectedAutoLockInterval, setSelectedAutoLockInterval] = useState<unknown>(null);
  const [isImportDataLoading, setIsImportDataLoading] = useState(false);

  const [isErrorReportingEnabled] = useState(() => storage.get(StorageKey.DisableErrorReporting) === false);
  const [appVersion] = useState(() => `v${((window as any).electronAppVersion || application.bridge.appVersion)}`);
  const [hasPasscode, setHasPasscode] = useState(application.hasPasscode());
  const [isBackupEncrypted, setIsBackupEncrypted] = useState(isEncryptionEnabled);
  const [protectionsDisabledUntil, setProtectionsDisabledUntil] = useState(getProtectionsDisabledUntil());
  const [user, setUser] = useState(application.getUser());
  const [canAddPasscode, setCanAddPasscode] = useState(!application.isEphemeralSession());
  const [hasProtections] = useState(application.hasProtectionSources());

  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasscodeFocused, setIsPasscodeFocused] = useState(false);

  const { notesAndTagsCount } = appState.accountMenu;

  const refreshCredentialState = () => {
    setUser(application.getUser());
    setCanAddPasscode(!application.isEphemeralSession());
    setHasPasscode(application.hasPasscode());
    setShowPasscodeForm(false);
  };

  const loadHost = () => {
    const host = application.getHost();
    setServer(host);
    setUrl(host);
  };

  const reloadAutoLockInterval = useCallback(async () => {
    const interval = await application.getAutolockService().getAutoLockInterval();
    setSelectedAutoLockInterval(interval);
  }, [application]);

  const refreshEncryptionStatus = () => {
    const hasUser = application.hasAccount();
    const hasPasscode = application.hasPasscode();

    setHasPasscode(hasPasscode);

    const encryptionEnabled = hasUser || hasPasscode;

    const newEncryptionStatusString = hasUser
      ? STRING_E2E_ENABLED
      : hasPasscode
        ? STRING_LOCAL_ENC_ENABLED
        : STRING_ENC_NOT_ENABLED;

    setEncryptionStatusString(newEncryptionStatusString);
    setIsEncryptionEnabled(encryptionEnabled);
    setIsBackupEncrypted(encryptionEnabled);
  };

  const errorReportingIdValue = errorReportingId();
  const keyStorageInfo = StringUtils.keyStorageInfo(application);
  const passcodeAutoLockOptions = application.getAutolockService().getAutoLockIntervalOptions();
  const showBetaWarning = appState.showBetaWarning;

  const closeAccountMenu = () => {
    appState.accountMenu.closeAccountMenu();
  };

  const handleSignInClick = () => {
    setShowLogin(true);
    setIsEmailFocused(true);
  };

  const handleRegisterClick = () => {
    setShowRegister(true);
    setIsEmailFocused(true);
  };

  const blurAuthFields = () => {
    emailInputRef.current.blur();
    passwordInputRef.current.blur();
    passwordConfirmationInputRef.current?.blur();
  };

  const login = async () => {
    setStatus(STRING_GENERATING_LOGIN_KEYS);
    setIsAuthenticating(true);

    const response = await application.signIn(
      email as string,
      password,
      isStrictSignIn,
      isEphemeral,
      shouldMergeLocal
    );
    const error = response.error;
    if (!error) {
      setIsAuthenticating(false);
      setPassword('');

      closeAccountMenu();
      return;
    }

    setShowLogin(true);
    setStatus(undefined);
    setPassword('');

    if (error.message) {
      await application.alertService.alert(error.message);
    }

    setIsAuthenticating(false);
  };

  const register = async () => {
    if (passwordConfirmation !== password) {
      application.alertService.alert(STRING_NON_MATCHING_PASSWORDS);
      return;
    }
    setStatus(STRING_GENERATING_REGISTER_KEYS);
    setIsAuthenticating(true);

    const response = await application.register(
      email as string,
      password,
      isEphemeral,
      shouldMergeLocal
    );

    const error = response.error;
    if (error) {
      setStatus(undefined);
      setIsAuthenticating(false);

      application.alertService.alert(error.message);
    } else {
      setIsAuthenticating(false);
      closeAccountMenu();
    }
  };

  const handleAuthFormSubmit = (event:
                                  TargetedEvent<HTMLFormElement> |
                                  TargetedMouseEvent<HTMLButtonElement> |
                                  TargetedKeyboardEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();

    if (!email || !password) {
      return;
    }

    blurAuthFields();

    if (showLogin) {
      login();
    } else {
      register();
    }
  };

  const handleHostInputChange = (event: TargetedEvent<HTMLInputElement>) => {
    const { value } = event.target as HTMLInputElement;
    setUrl(value);
    application.setHost(value);
  };

  const handleKeyPressKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleAuthFormSubmit(event as TargetedKeyboardEvent<HTMLButtonElement>);
    }
  };

  const handlePasswordChange = (event: TargetedEvent<HTMLInputElement>) => {
    const { value } = event.target as HTMLInputElement;
    setPassword(value);
  };

  const handleEmailChange = (event: TargetedEvent<HTMLInputElement>) => {
    const { value } = event.target as HTMLInputElement;
    setEmail(value);
  };

  const handlePasswordConfirmationChange = (event: TargetedEvent<HTMLInputElement>) => {
    const { value } = event.target as HTMLInputElement;
    setPasswordConfirmation(value);
  };

  const handleMergeLocalData = async (event: TargetedEvent<HTMLInputElement>) => {
    const { checked } = event.target as HTMLInputElement;

    if (!checked) {
      setShouldMergeLocal(checked);

      const confirmResult = await confirmDialog({
        text: STRING_ACCOUNT_MENU_UNCHECK_MERGE,
        confirmButtonStyle: 'danger'
      });
      setShouldMergeLocal(!confirmResult);
    }
  };

  const openPasswordWizard = () => {
    closeAccountMenu();
    application.presentPasswordWizard(PasswordWizardType.ChangePassword);
  };

  const openSessionsModal = () => {
    closeAccountMenu();
    appState.openSessionsModal();
  };

  const getEncryptionStatusForNotes = () => {
    const length = notesAndTagsCount;
    return `${length}/${length} notes and tags encrypted`;
  };

  const enableProtections = () => {
    application.clearProtectionSession();
  };

  const handleAddPassCode = () => {
    setShowPasscodeForm(true);
    setIsPasscodeFocused(true);
  };

  const submitPasscodeForm = async (event: TargetedEvent<HTMLFormElement> | TargetedMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (passcode !== passcodeConfirmation) {
      await alertDialog({
        text: STRING_NON_MATCHING_PASSCODES
      });
      setIsPasscodeFocused(true);
      return;
    }

    await preventRefreshing(
      STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_CHANGE,
      async () => {
        const successful = application.hasPasscode()
          ? await application.changePasscode(passcode as string)
          : await application.addPasscode(passcode as string);

        if (!successful) {
          setIsPasscodeFocused(true);
        }
      }
    );

    setPasscode(undefined);
    setPasscodeConfirmation(undefined);
    setShowPasscodeForm(false);

    refreshEncryptionStatus();
  };

  const handlePasscodeChange = (event: TargetedEvent<HTMLInputElement>) => {
    const { value } = event.target as HTMLInputElement;
    setPasscode(value);
  };

  const handleConfirmPasscodeChange = (event: TargetedEvent<HTMLInputElement>) => {
    const { value } = event.target as HTMLInputElement;
    setPasscodeConfirmation(value);
  };

  const selectAutoLockInterval = async (interval: number) => {
    if (!(await application.authorizeAutolockIntervalChange())) {
      return;
    }
    await application.getAutolockService().setAutoLockInterval(interval);
    reloadAutoLockInterval();
  };

  const disableBetaWarning = () => {
    appState.disableBetaWarning();
  };

  const hidePasswordForm = () => {
    setShowLogin(false);
    setShowRegister(false);
    setPassword('');
    setPasswordConfirmation(undefined);
  };

  const signOut = () => {
    appState.accountMenu.setSigningOut(true);
  };

  const changePasscodePressed = () => {
    handleAddPassCode();
  };

  const removePasscodePressed = async () => {
    await preventRefreshing(
      STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_REMOVAL,
      async () => {
        if (await application.removePasscode()) {
          await application
            .getAutolockService()
            .deleteAutolockPreference();
          await reloadAutoLockInterval();
          refreshEncryptionStatus();
        }
      }
    );
  };

  const downloadDataArchive = () => {
    application.getArchiveService().downloadBackup(isBackupEncrypted);
  };


  const readFile = async (file: File): Promise<any> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target!.result as string);
          resolve(data);
        } catch (e) {
          application.alertService.alert(STRING_INVALID_IMPORT_FILE);
        }
      };
      reader.readAsText(file);
    });
  };

  const performImport = async (data: BackupFile) => {
    setIsImportDataLoading(true);

    const result = await application.importData(data);

    setIsImportDataLoading(false);

    if (!result) {
      return;
    }

    let statusText = STRING_IMPORT_SUCCESS;
    if ('error' in result) {
      statusText = result.error;
    } else if (result.errorCount) {
      statusText = StringImportError(result.errorCount);
    }
    void alertDialog({
      text: statusText
    });
  };

  const importFileSelected = async (event: TargetedEvent<HTMLInputElement, Event>) => {
    const { files } = (event.target as HTMLInputElement);

    if (!files) {
      return;
    }
    const file = files[0];
    const data = await readFile(file);
    if (!data) {
      return;
    }

    const version = data.version || data.keyParams?.version || data.auth_params?.version;
    if (!version) {
      await performImport(data);
      return;
    }

    if (
      application.protocolService.supportedVersions().includes(version)
    ) {
      await performImport(data);
    } else {
      setIsImportDataLoading(false);
      void alertDialog({ text: STRING_UNSUPPORTED_BACKUP_FILE_VERSION });
    }
  };

  const toggleErrorReportingEnabled = () => {
    if (isErrorReportingEnabled) {
      disableErrorReporting();
    } else {
      enableErrorReporting();
    }
    if (!appState.sync.inProgress) {
      window.location.reload();
    }
  };

  const openErrorReportingDialog = () => {
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
      `
    });
  };

  // Add the required event observers
  useEffect(() => {
    const removeAppLaunchedObserver = application.addEventObserver(
      async () => {
        refreshCredentialState();
        loadHost();
        reloadAutoLockInterval();
        refreshEncryptionStatus();
      },
      ApplicationEvent.Launched
    );

    const removeKeyStatusChangedObserver = application.addEventObserver(
      async () => {
        refreshCredentialState();
      },
      ApplicationEvent.KeyStatusChanged
    );

    const removeProtectionSessionExpiryDateChangedObserver = application.addEventObserver(
      async () => {
        setProtectionsDisabledUntil(getProtectionsDisabledUntil());
      },
      ApplicationEvent.ProtectionSessionExpiryDateChanged
    );

    return () => {
      removeAppLaunchedObserver();
      removeKeyStatusChangedObserver();
      removeProtectionSessionExpiryDateChangedObserver();
    };
  }, []);

  // `reloadAutoLockInterval` gets interval asynchronously, therefore we call `useEffect` to set initial
  // value of `selectedAutoLockInterval`
  useEffect(() => {
    reloadAutoLockInterval();
  }, [reloadAutoLockInterval]);

  useEffect(() => {
    refreshEncryptionStatus();
  }, [refreshEncryptionStatus]);

  useEffect(() => {
    if (isEmailFocused) {
      emailInputRef.current.focus();
      setIsEmailFocused(false);
    }
    if (isPasscodeFocused) {
      passcodeInputRef.current.focus();
      setIsPasscodeFocused(false);
    }
  }, [isEmailFocused, isPasscodeFocused]);

  return (
    <div className="sn-component">
      <div id="account-panel" className="sk-panel">
        <div className="sk-panel-header">
          <div className="sk-panel-header-title">Account</div>
          <a className="sk-a info close-button" onClick={closeAccountMenu}>Close</a>
        </div>
        <div className="sk-panel-content">
          {!user && !showLogin && !showRegister && (
            <div className="sk-panel-section sk-panel-hero">
              <div className="sk-panel-row">
                <div className="sk-h1">Sign in or register to enable sync and end-to-end encryption.</div>
              </div>
              <div className="flex my-1">
                <button
                  className="sn-button info flex-grow text-base py-3 mr-1.5"
                  onClick={handleSignInClick}
                >
                  Sign In
                </button>
                <button
                  className="sn-button info flex-grow text-base py-3 ml-1.5"
                  onClick={handleRegisterClick}
                >
                  Register
                </button>
              </div>
              <div className="sk-panel-row sk-p">
                Standard Notes is free on every platform, and comes
                standard with sync and encryption.
              </div>
            </div>
          )}
          {(showLogin || showRegister) && (
            <div className="sk-panel-section">
              <div className="sk-panel-section-title">
                {showLogin ? 'Sign In' : 'Register'}
              </div>
              <form className="sk-panel-form" onSubmit={handleAuthFormSubmit} noValidate>
                <div className="sk-panel-section">
                  <input className="sk-input contrast"
                         name="email"
                         type="email"
                         value={email}
                         onChange={handleEmailChange}
                         placeholder="Email"
                         required
                         spellcheck={false}
                         ref={emailInputRef}
                  />
                  <input className="sk-input contrast"
                         name="password"
                         type="password"
                         value={password}
                         onChange={handlePasswordChange}
                         placeholder="Password"
                         required
                         onKeyPress={handleKeyPressKeyDown}
                         onKeyDown={handleKeyPressKeyDown}
                         ref={passwordInputRef}
                  />
                  {showRegister &&
                  <input className="sk-input contrast"
                         name="password_conf"
                         type="password"
                         placeholder="Confirm Password" required
                         onKeyPress={handleKeyPressKeyDown}
                         onKeyDown={handleKeyPressKeyDown}
                         value={passwordConfirmation}
                         onChange={handlePasswordConfirmationChange}
                         ref={passwordConfirmationInputRef}
                  />}
                  <div className="sk-panel-row" />
                  <a className="sk-panel-row sk-bold" onClick={() => {
                    setShowAdvanced(!showAdvanced);
                  }}>
                    Advanced Options
                  </a>
                </div>
                {showAdvanced && (
                  <div className="sk-notification unpadded contrast advanced-options sk-panel-row">
                    <div className="sk-panel-column stretch">
                      <div className="sk-notification-title sk-panel-row padded-row">
                        Advanced Options
                      </div>
                      <div className="bordered-row padded-row">
                        <label className="sk-label">Sync Server Domain</label>
                        <input className="sk-input sk-base"
                               name="server"
                               placeholder="Server URL"
                               onChange={handleHostInputChange}
                               value={url}
                               required
                        />
                      </div>
                      {showLogin && (
                        <label className="sk-label padded-row sk-panel-row justify-left">
                          <div className="sk-horizontal-group tight">
                            <input
                              className="sk-input"
                              type="checkbox"
                              onChange={() => setIsStrictSignIn(prevState => !prevState)}
                            />
                            <p className="sk-p">Use strict sign in</p>
                            <span>
                                <a className="info"
                                   href="https://standardnotes.org/help/security" rel="noopener"
                                   target="_blank"
                                >
                                  (Learn more)
                                </a>
                              </span>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                )}
                {!isAuthenticating && (
                  <div className="sk-panel-section form-submit">
                    <button className="sn-button info text-base py-3 text-center" type="submit"
                            disabled={isAuthenticating}>
                      {showLogin ? 'Sign In' : 'Register'}
                    </button>
                  </div>
                )}
                {showRegister && (
                  <div className="sk-notification neutral">
                    <div className="sk-notification-title">No Password Reset.</div>
                    <div className="sk-notification-text">
                      Because your notes are encrypted using your password,
                      Standard Notes does not have a password reset option.
                      You cannot forget your password.
                    </div>
                  </div>
                )}
                {status && (
                  <div className="sk-panel-section no-bottom-pad">
                    <div className="sk-horizontal-group">
                      <div className="sk-spinner small neutral" />
                      <div className="sk-label">{status}</div>
                    </div>
                  </div>
                )}
                {!isAuthenticating && (
                  <div className="sk-panel-section no-bottom-pad">
                    <label className="sk-panel-row justify-left">
                      <div className="sk-horizontal-group tight">
                        <input
                          type="checkbox"
                          checked={!isEphemeral}
                          onChange={() => setIsEphemeral(prevState => !prevState)}
                        />
                        <p className="sk-p">Stay signed in</p>
                      </div>
                    </label>
                    {notesAndTagsCount > 0 && (
                      <label className="sk-panel-row justify-left">
                        <div className="sk-horizontal-group tight">
                          <input
                            type="checkbox"
                            checked={shouldMergeLocal}
                            onChange={handleMergeLocalData}
                          />
                          <p className="sk-p">Merge local data ({notesAndTagsCount}) notes and tags</p>
                        </div>
                      </label>
                    )}
                  </div>
                )}
              </form>
            </div>
          )}
          {!showLogin && !showRegister && (
            <div>
              {user && (
                <div className="sk-panel-section">
                  {appState.sync.errorMessage && (
                    <div className="sk-notification danger">
                      <div className="sk-notification-title">Sync Unreachable</div>
                      <div className="sk-notification-text">
                        Hmm...we can't seem to sync your account.
                        The reason: {appState.sync.errorMessage}
                      </div>
                      <a
                        className="sk-a info-contrast sk-bold sk-panel-row"
                        href="https://standardnotes.org/help"
                        rel="noopener"
                        target="_blank"
                      >
                        Need help?
                      </a>
                    </div>
                  )}
                  <div className="sk-panel-row">
                    <div className="sk-panel-column">
                      <div className="sk-h1 sk-bold wrap">
                        {user.email}
                      </div>
                      <div className="sk-subtitle neutral">
                        {server}
                      </div>
                    </div>
                  </div>
                  <div className="sk-panel-row" />
                  <a className="sk-a info sk-panel-row condensed" onClick={openPasswordWizard}>
                    Change Password
                  </a>
                  <a className="sk-a info sk-panel-row condensed" onClick={openSessionsModal}>
                    Manage Sessions
                  </a>
                </div>
              )}

              <div className="sk-panel-section">
                <div className="sk-panel-section-title">
                  Encryption
                </div>
                {isEncryptionEnabled && (
                  <div className="sk-panel-section-subtitle info">
                    {getEncryptionStatusForNotes()}
                  </div>
                )}
                <p className="sk-p">
                  {encryptionStatusString}
                </p>
              </div>
              {hasProtections && (
                <div className="sk-panel-section">
                  <div className="sk-panel-section-title">Protections</div>
                  {protectionsDisabledUntil && (
                    <div className="sk-panel-section-subtitle info">
                      Protections are disabled until {protectionsDisabledUntil}
                    </div>
                  )}
                  {!protectionsDisabledUntil && (
                    <div className="sk-panel-section-subtitle info">
                      Protections are enabled
                    </div>
                  )}
                  <p className="sk-p">
                    Actions like viewing protected notes, exporting decrypted backups,
                    or revoking an active session, require additional authentication
                    like entering your account password or application passcode.
                  </p>
                  {protectionsDisabledUntil && (
                    <div className="sk-panel-row">
                      <button className="sn-button small info" onClick={enableProtections}>
                        Enable protections
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="sk-panel-section">
                <div className="sk-panel-section-title">Passcode Lock</div>
                {!hasPasscode && (
                  <div>
                    {canAddPasscode && (
                      <>
                        {!showPasscodeForm && (
                          <div className="sk-panel-row">
                            <button className="sn-button small info" onClick={handleAddPassCode}>
                              Add Passcode
                            </button>
                          </div>
                        )}
                        <p className="sk-p">
                          Add a passcode to lock the application and
                          encrypt on-device key storage.
                        </p>
                        {keyStorageInfo && (
                          <p>{keyStorageInfo}</p>
                        )}
                      </>
                    )}
                    {!canAddPasscode && (
                      <p className="sk-p">
                        Adding a passcode is not supported in temporary sessions. Please sign
                        out, then sign back in with the "Stay signed in" option checked.
                      </p>
                    )}
                  </div>
                )}
                {showPasscodeForm && (
                  <form className="sk-panel-form" onSubmit={submitPasscodeForm}>
                    <div className="sk-panel-row" />
                    <input
                      className="sk-input contrast"
                      type="password"
                      ref={passcodeInputRef}
                      value={passcode}
                      onChange={handlePasscodeChange}
                      placeholder="Passcode"
                    />
                    <input
                      className="sk-input contrast"
                      type="password"
                      value={passcodeConfirmation}
                      onChange={handleConfirmPasscodeChange}
                      placeholder="Confirm Passcode"
                    />
                    <button className="sn-button small info mt-2" onClick={submitPasscodeForm}>
                      Set Passcode
                    </button>
                    <button className="sn-button small outlined ml-2" onClick={() => setShowPasscodeForm(false)}>
                      Cancel
                    </button>
                  </form>
                )}
                {hasPasscode && !showPasscodeForm && (
                  <>
                    <div className="sk-panel-section-subtitle info">Passcode lock is enabled</div>
                    <div className="sk-notification contrast">
                      <div className="sk-notification-title">Options</div>
                      <div className="sk-notification-text">
                        <div className="sk-panel-row">
                          <div className="sk-horizontal-group">
                            <div className="sk-h4 sk-bold">Autolock</div>
                            {passcodeAutoLockOptions.map(option => {
                              return (
                                <a
                                  className={`sk-a info ${option.value === selectedAutoLockInterval ? 'boxed' : ''}`}
                                  onClick={() => selectAutoLockInterval(option.value)}>
                                  {option.label}
                                </a>
                              );
                            })}
                          </div>
                        </div>
                        <div className="sk-p">The autolock timer begins when the window or tab loses focus.</div>
                        <div className="sk-panel-row" />
                        <a className="sk-a info sk-panel-row condensed" onClick={changePasscodePressed}>
                          Change Passcode
                        </a>
                        <a className="sk-a danger sk-panel-row condensed" onClick={removePasscodePressed}>
                          Remove Passcode
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </div>
              {isImportDataLoading ? (
                <div className="sk-spinner small info" />
              ) : (
                <div className="sk-panel-section">
                  <div className="sk-panel-section-title">Data Backups</div>
                  <div className="sk-p">Download a backup of all your data.</div>
                  {isEncryptionEnabled && (
                    <form className="sk-panel-form sk-panel-row">
                      <div className="sk-input-group">
                        <label className="sk-horizontal-group tight">
                          <input
                            type="radio"
                            onChange={() => setIsBackupEncrypted(true)}
                            checked={isBackupEncrypted}
                          />
                          <p className="sk-p">Encrypted</p>
                        </label>
                        <label className="sk-horizontal-group tight">
                          <input
                            type="radio"
                            onChange={() => setIsBackupEncrypted(false)}
                            checked={!isBackupEncrypted}
                          />
                          <p className="sk-p">Decrypted</p>
                        </label>
                      </div>
                    </form>
                  )}
                  <div className="sk-panel-row" />
                  <div className="flex">
                    <button className="sn-button small info" onClick={downloadDataArchive}>Download Backup</button>
                    <label className="sn-button small flex items-center info ml-2">
                      <input
                        type="file"
                        onChange={importFileSelected}
                        style={{ display: 'none' }}
                      />
                      Import Backup
                    </label>
                  </div>
                  {isDesktopApplication() && (
                    <p className="mt-5">
                      Backups are automatically created on desktop and can be managed
                      via the "Backups" top-level menu.
                    </p>
                  )}
                  <div className="sk-panel-row" />
                </div>
              )}
              <div className="sk-panel-section">
                <div className="sk-panel-section-title">Error Reporting</div>
                <div className="sk-panel-section-subtitle info">
                  Automatic error reporting is {isErrorReportingEnabled ? 'enabled' : 'disabled'}
                </div>
                <p className="sk-p">
                  Help us improve Standard Notes by automatically submitting
                  anonymized error reports.
                </p>
                {errorReportingIdValue && (
                  <>
                    <p className="sk-p selectable">
                      Your random identifier is
                      strong {errorReportingIdValue}
                    </p>
                    <p className="sk-p">
                      Disabling error reporting will remove that identifier from your
                      local storage, and a new identifier will be created should you
                      decide to enable error reporting again in the future.
                    </p>
                  </>
                )}
                <div className="sk-panel-row">
                  <button className="sn-button small info" onClick={toggleErrorReportingEnabled}>
                    {isErrorReportingEnabled ? 'Disable' : 'Enable'} Error Reporting
                  </button>
                </div>
                <div className="sk-panel-row">
                  <a className="sk-a" onClick={openErrorReportingDialog}>What data is being sent?</a>
                </div>
              </div>
            </div>
          )}
        </div>
        <ConfirmSignoutContainer application={application} appState={appState} />
        <div className="sk-panel-footer">
          <div className="sk-panel-row">
            <div className="sk-p left neutral">
              <span>{appVersion}</span>
              {showBetaWarning && (
                <span>
                  <span> (</span>
                  <a className="sk-a" onClick={disableBetaWarning}>Hide beta warning</a>
                  <span>)</span>
                </span>
              )}
            </div>
            {(showLogin || showRegister) && (
              <a className="sk-a right" onClick={hidePasswordForm}>Cancel</a>
            )}
            {!showLogin && !showRegister && (
              <a className="sk-a right danger capitalize" onClick={signOut}>
                {user ? 'Sign out' : 'Clear session data'}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export const AccountMenuDirective = toDirective<Props>(
  AccountMenu
);

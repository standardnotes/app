import { observer } from 'mobx-react-lite';
import { toDirective } from '@/components/utils';
import { AppState } from '@/ui_models/app_state';
import { WebApplication } from '@/ui_models/application';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import { isDesktopApplication, isSameDay, preventRefreshing } from '@/utils';
import { storage, StorageKey } from '@Services/localStorage';
import { disableErrorReporting, enableErrorReporting, errorReportingId } from '@Services/errorReporting';
import {
  STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_CHANGE,
  STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_REMOVAL,
  STRING_E2E_ENABLED,
  STRING_ENC_NOT_ENABLED,
  STRING_IMPORT_SUCCESS,
  STRING_INVALID_IMPORT_FILE,
  STRING_LOCAL_ENC_ENABLED,
  STRING_NON_MATCHING_PASSCODES,
  STRING_UNSUPPORTED_BACKUP_FILE_VERSION,
  StringImportError,
  StringUtils
} from '@/strings';
import { ApplicationEvent, BackupFile } from '@node_modules/@standardnotes/snjs';
import { JSXInternal } from '@node_modules/preact/src/jsx';
import TargetedEvent = JSXInternal.TargetedEvent;
import TargetedMouseEvent = JSXInternal.TargetedMouseEvent;
import { alertDialog } from '@Services/alertService';
import { ConfirmSignoutContainer } from '@/components/ConfirmSignoutModal';
import Authentication from '@/components/AccountMenu/Authentication';
import Footer from '@/components/AccountMenu/Footer';
import User from '@/components/AccountMenu/User';
import Encryption from '@/components/AccountMenu/Encryption';
import Protections from '@/components/AccountMenu/Protections';
import PasscodeLock from '@/components/AccountMenu/PasscodeLock';

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


  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // const [password, setPassword] = useState('');
  // const [passwordConfirmation, setPasswordConfirmation] = useState<string | undefined>(undefined);

  const [encryptionStatusString, setEncryptionStatusString] = useState<string | undefined>(undefined);
  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(false);

  const [server, setServer] = useState<string | undefined>(application.getHost());
  // const [url, setUrl] = useState<string | undefined>(application.getHost());
  const [isImportDataLoading, setIsImportDataLoading] = useState(false);

  const [isErrorReportingEnabled] = useState(() => storage.get(StorageKey.DisableErrorReporting) === false);
  const [isBackupEncrypted, setIsBackupEncrypted] = useState(isEncryptionEnabled);
  const [protectionsDisabledUntil, setProtectionsDisabledUntil] = useState(getProtectionsDisabledUntil());
  const [user, setUser] = useState(application.getUser());
  const [hasProtections] = useState(application.hasProtectionSources());


  const { notesAndTagsCount } = appState.accountMenu;

  const errorReportingIdValue = errorReportingId();

  const closeAccountMenu = () => {
    appState.accountMenu.closeAccountMenu();
  };







  /*
  const hidePasswordForm = () => {
    setShowLogin(false);
    setShowRegister(false);
    // TODO: Vardan: check whether the uncommented parts below don't brake anything
    //  (I commented them on trying to move those 2 setters into `Authentication` component)
    // setPassword('');
    // setPasswordConfirmation(undefined);
  };
  */

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
    const removeKeyStatusChangedObserver = application.addEventObserver(
      async () => {
        setUser(application.getUser());
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
      removeKeyStatusChangedObserver();
      removeProtectionSessionExpiryDateChangedObserver();
    };
  }, []); // TODO:fix dependency list (should they left empty?)



  return (
    <div className="sn-component">
      <div id="account-panel" className="sk-panel">
        <div className="sk-panel-header">
          <div className="sk-panel-header-title">Account</div>
          <a className="sk-a info close-button" onClick={closeAccountMenu}>Close</a>
        </div>
        <div className="sk-panel-content">
          <Authentication
            application={application}
            // url={url}
            // setUrl={setUrl}
            server={server}
            setServer={setServer}
            closeAccountMenu={closeAccountMenu}
            notesAndTagsCount={notesAndTagsCount}
            showLogin={showLogin}
            setShowLogin={setShowLogin}
            showRegister={showRegister}
            setShowRegister={setShowRegister}
            user={user}
          />
          {!showLogin && !showRegister && (
            <div>
              {user && (
                <User
                  email={user.email}
                  server={server}
                  appState={appState}
                  application={application}
                  closeAccountMenu={closeAccountMenu}
                />
              )}
              <Encryption
                isEncryptionEnabled={isEncryptionEnabled}
                notesAndTagsCount={notesAndTagsCount}
                encryptionStatusString={encryptionStatusString}
              />
              {hasProtections && (
                <Protections
                  application={application}
                  protectionsDisabledUntil={protectionsDisabledUntil}
                />
              )}
              <PasscodeLock
                application={application}
                setEncryptionStatusString={setEncryptionStatusString}
                setIsEncryptionEnabled={setIsEncryptionEnabled}
                setIsBackupEncrypted={setIsBackupEncrypted}
              />
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
        <Footer
          appState={appState}
          application={application}
          showLogin={showLogin}
          setShowLogin={setShowLogin}
          showRegister={showRegister}
          setShowRegister={setShowRegister}
          user={user}
        />
      </div>
    </div>
  );
});

export const AccountMenuDirective = toDirective<Props>(
  AccountMenu
);

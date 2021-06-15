import { observer } from 'mobx-react-lite';
import { toDirective } from '@/components/utils';
import { AppState } from '@/ui_models/app_state';
import { WebApplication } from '@/ui_models/application';
import { useEffect, useState } from 'preact/hooks';
import { isSameDay } from '@/utils';
import { ApplicationEvent } from '@standardnotes/snjs';
import { ConfirmSignoutContainer } from '@/components/ConfirmSignoutModal';
import Authentication from '@/components/AccountMenu/Authentication';
import Footer from '@/components/AccountMenu/Footer';
import User from '@/components/AccountMenu/User';
import Encryption from '@/components/AccountMenu/Encryption';
import Protections from '@/components/AccountMenu/Protections';
import PasscodeLock from '@/components/AccountMenu/PasscodeLock';
import DataBackup from '@/components/AccountMenu/DataBackup';
import ErrorReporting from '@/components/AccountMenu/ErrorReporting';
import { useCallback } from 'preact/hooks';

type Props = {
  appState: AppState;
  application: WebApplication;
};

const AccountMenu = observer(({ application, appState }: Props) => {
  const getProtectionsDisabledUntil = useCallback((): string | null => {
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
  }, [application]);

  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [encryptionStatusString, setEncryptionStatusString] = useState<string | undefined>(undefined);
  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(false);
  const [server, setServer] = useState<string | undefined>(application.getHost());
  const [isBackupEncrypted, setIsBackupEncrypted] = useState(isEncryptionEnabled);
  const [protectionsDisabledUntil, setProtectionsDisabledUntil] = useState(getProtectionsDisabledUntil());
  const [user, setUser] = useState(application.getUser());
  const [hasProtections] = useState(application.hasProtectionSources());

  const { notesAndTagsCount } = appState.accountMenu;

  const closeAccountMenu = () => {
    appState.accountMenu.closeAccountMenu();
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
  }, [application, getProtectionsDisabledUntil]);

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
              <DataBackup
                application={application}
                isBackupEncrypted={isBackupEncrypted}
                isEncryptionEnabled={isEncryptionEnabled}
                setIsBackupEncrypted={setIsBackupEncrypted}
              />
              <ErrorReporting appState={appState} />
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

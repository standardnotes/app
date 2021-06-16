import { observer } from 'mobx-react-lite';
import { toDirective } from '@/components/utils';
import { AppState } from '@/ui_models/app_state';
import { WebApplication } from '@/ui_models/application';
import { useEffect, useState } from 'preact/hooks';
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

type Props = {
  appState: AppState;
  application: WebApplication;
};

const AccountMenu = observer(({ application, appState }: Props) => {
  const [user, setUser] = useState(application.getUser());

  const {
    showLogin,
    showRegister,
    closeAccountMenu
  } = appState.accountMenu;

  // Add the required event observers
  useEffect(() => {
    const removeKeyStatusChangedObserver = application.addEventObserver(
      async () => {
        setUser(application.getUser());
      },
      ApplicationEvent.KeyStatusChanged
    );

    return () => {
      removeKeyStatusChangedObserver();
    };
  }, [application]);

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
            appState={appState}
            user={user}
          />
          {!showLogin && !showRegister && (
            <div>
              {user && (
                <User
                  application={application}
                  appState={appState}
                  email={user.email}
                />
              )}
              <Encryption appState={appState} />
              <Protections application={application} />
              <PasscodeLock
                application={application}
                appState={appState}
              />
              <DataBackup
                application={application}
                appState={appState}
              />
              <ErrorReporting appState={appState} />
            </div>
          )}
        </div>
        <ConfirmSignoutContainer
          application={application}
          appState={appState}
        />
        <Footer
          application={application}
          appState={appState}
          user={user}
        />
      </div>
    </div>
  );
});

export const AccountMenuDirective = toDirective<Props>(
  AccountMenu
);

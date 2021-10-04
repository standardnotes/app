import { observer } from 'mobx-react-lite';
import { toDirective } from '@/components/utils';
import { AppState } from '@/ui_models/app_state';
import { WebApplication } from '@/ui_models/application';
import { ConfirmSignoutContainer } from '@/components/ConfirmSignoutModal';
import Authentication from '@/components/AccountMenu/Authentication';
import Footer from '@/components/AccountMenu/Footer';
import User from '@/components/AccountMenu/User';
import { useEffect } from 'preact/hooks';

type Props = {
  appState: AppState;
  application: WebApplication;
};

const AccountMenu = observer(({ application, appState }: Props) => {
  const {
    show: showAccountMenu,
    showLogin,
    showRegister,
    setShowLogin,
    setShowRegister,
    closeAccountMenu
  } = appState.accountMenu;

  const user = application.getUser();

  useEffect(() => {
    // Reset "Login" and "Registration" sections state when hiding account menu,
    // so the next time account menu is opened these sections are closed
    if (!showAccountMenu) {
      setShowLogin(false);
      setShowRegister(false);
    }
  }, [setShowLogin, setShowRegister, showAccountMenu]);

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
          />
          {!showLogin && !showRegister && user && (
            <div>
              <User
                application={application}
                appState={appState}
              />
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
        />
      </div>
    </div>
  );
});

export const AccountMenuDirective = toDirective<Props>(
  AccountMenu
);

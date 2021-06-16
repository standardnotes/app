import { AppState } from '@/ui_models/app_state';
import { useState } from 'preact/hooks';
import { WebApplication } from '@/ui_models/application';
import { User } from '@standardnotes/snjs/dist/@types/services/api/responses';
import { observer } from 'mobx-react-lite';

type Props = {
  application: WebApplication;
  appState: AppState;
  user: User | undefined;
}

const Footer = observer(({
                           application,
                           appState,
                           user
                         }: Props) => {
  const {
    showLogin,
    showRegister,
    setShowLogin,
    setShowRegister,
    setSigningOut
  } = appState.accountMenu;

  const { showBetaWarning, disableBetaWarning: disableAppStateBetaWarning } = appState;

  const [appVersion] = useState(() => `v${((window as any).electronAppVersion || application.bridge.appVersion)}`);

  const disableBetaWarning = () => {
    disableAppStateBetaWarning();
  };

  const signOut = () => {
    setSigningOut(true);
  };

  const hidePasswordForm = () => {
    setShowLogin(false);
    setShowRegister(false);
  };

  return (
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
  );
});

export default Footer;

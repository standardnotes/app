import { AppState } from '@/ui_models/app_state';
import { useState } from 'preact/hooks';
import { WebApplication } from '@/ui_models/application';
import { observer } from 'mobx-react-lite';

type Props = {
  application: WebApplication;
  appState: AppState;
};

const Footer = observer(({ application, appState }: Props) => {
  const {
    showSignIn,
    showRegister,
    setShowSignIn,
    setShowRegister,
    setSigningOut,
  } = appState.accountMenu;

  const user = application.getUser();

  const { showBetaWarning, disableBetaWarning: disableAppStateBetaWarning } =
    appState;

  const [appVersion] = useState(
    () =>
      `v${(window as any).electronAppVersion || application.bridge.appVersion}`
  );

  const disableBetaWarning = () => {
    disableAppStateBetaWarning();
  };

  const signOut = () => {
    setSigningOut(true);
  };

  const hidePasswordForm = () => {
    setShowSignIn(false);
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
              <a className="sk-a" onClick={disableBetaWarning}>
                Hide beta warning
              </a>
              <span>)</span>
            </span>
          )}
        </div>
        {(showSignIn || showRegister) && (
          <a className="sk-a right" onClick={hidePasswordForm}>
            Cancel
          </a>
        )}
        {!showSignIn && !showRegister && (
          <a className="sk-a right danger capitalize" onClick={signOut}>
            {user ? 'Sign out' : 'Clear session data'}
          </a>
        )}
      </div>
    </div>
  );
});

export default Footer;

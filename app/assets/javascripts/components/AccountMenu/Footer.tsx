import { FunctionalComponent } from 'preact';
import { AppState } from '@/ui_models/app_state';
import { StateUpdater, useState } from '@node_modules/preact/hooks';
import { WebApplication } from '@/ui_models/application';
import { User } from '@node_modules/@standardnotes/snjs/dist/@types/services/api/responses';
import { observer } from '@node_modules/mobx-react-lite';

type Props = {
  appState: AppState;
  application: WebApplication;
  showLogin: boolean;
  setShowLogin: StateUpdater<boolean>;
  showRegister: boolean;
  setShowRegister: StateUpdater<boolean>;
  user: User | undefined;
}

const Footer = observer(({
                           appState,
                           application,
                           showLogin,
                           setShowLogin,
                           showRegister,
                           setShowRegister,
                           user
                         }: Props) => {

  const showBetaWarning = appState.showBetaWarning;


  const [appVersion] = useState(() => `v${((window as any).electronAppVersion || application.bridge.appVersion)}`);

  const disableBetaWarning = () => {
    appState.disableBetaWarning();
  };

  const signOut = () => {
    appState.accountMenu.setSigningOut(true);
  };

  const hidePasswordForm = () => {
    setShowLogin(false);
    setShowRegister(false);
    // TODO: Vardan: this comes from main `index.tsx` and the below commented parts should reset password and confirmation.
    //  Check whether it works when I don't call them explicitly.
    // setPassword('');
    // setPasswordConfirmation(undefined);
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

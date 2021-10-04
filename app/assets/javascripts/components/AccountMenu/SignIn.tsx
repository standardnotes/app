import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { AccountMenuPane } from '.';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import { InputWithIcon } from '../InputWithIcon';

type Props = {
  appState: AppState;
  application: WebApplication;
  setMenuPane: (pane: AccountMenuPane) => void;
};

export const SignInPane: FunctionComponent<Props> = observer(
  ({ application, appState, setMenuPane }) => {
    const { notesAndTagsCount } = appState.accountMenu;
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [syncServer, setSyncServer] = useState(
      () => application.getHost() || 'https://api.standardnotes.com'
    );
    const [isInvalid, setIsInvalid] = useState(false);
    const [isEphemeral, setIsEphemeral] = useState(false);
    const [isStrictSignin, setIsStrictSignin] = useState(false);
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [enableCustomServer, setEnableCustomServer] = useState(false);
    const [shouldMergeLocal, setShouldMergeLocal] = useState(true);

    const emailInputRef = useRef<HTMLInputElement>();
    const passwordInputRef = useRef<HTMLInputElement>();

    useEffect(() => {
      if (emailInputRef?.current) {
        emailInputRef.current.focus();
      }
    }, []);

    const resetInvalid = () => {
      if (isInvalid) {
        setIsInvalid(false);
      }
    };

    const handleEmailChange = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setEmail(e.target.value);
      }
    };

    const handlePasswordChange = (e: Event) => {
      if (isInvalid) {
        setIsInvalid(false);
      }
      if (e.target instanceof HTMLInputElement) {
        setPassword(e.target.value);
      }
    };

    const handleEphemeralChange = () => {
      setIsEphemeral(!isEphemeral);
    };

    const handleStrictSigninChange = () => {
      setIsStrictSignin(!isStrictSignin);
    };

    const handleShouldMergeChange = () => {
      setShouldMergeLocal(!shouldMergeLocal);
    };

    const handleEnableServerChange = () => {
      setEnableCustomServer(!enableCustomServer);
    };

    const handleSyncServerChange = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setSyncServer(e.target.value);
        application.setCustomHost(e.target.value);
      }
    };

    const signIn = () => {
      setIsSigningIn(true);
      emailInputRef?.current.blur();
      passwordInputRef?.current.blur();

      application
        .signIn(email, password, isStrictSignin, isEphemeral, shouldMergeLocal)
        .then((res) => {
          if (res.error) {
            throw new Error(res.error.message);
          }
          appState.accountMenu.closeAccountMenu();
        })
        .catch((err) => {
          console.error(err);
          if (err.toString().includes('Invalid email or password')) {
            setIsInvalid(true);
          } else {
            application.alertService.alert(err);
          }
          setPassword('');
          passwordInputRef?.current.blur();
        })
        .finally(() => {
          setIsSigningIn(false);
        });
    };

    const handleSignInFormSubmit = (e: Event) => {
      e.preventDefault();

      if (!email || email.length === 0) {
        emailInputRef?.current.focus();
        return;
      }

      if (!password || password.length === 0) {
        passwordInputRef?.current.focus();
        return;
      }

      signIn();
    };

    return (
      <>
        <div className="flex items-center px-3 mt-1 mb-3">
          <IconButton
            icon="arrow-left"
            title="Go back"
            className="flex mr-2 color-neutral"
            onClick={() => setMenuPane(AccountMenuPane.GeneralMenu)}
            focusable={true}
            disabled={isSigningIn}
          />
          <div className="sn-account-menu-headline">Sign in</div>
        </div>
        <form onSubmit={handleSignInFormSubmit}>
          <div className="px-3 mb-1">
            <InputWithIcon
              className={`mb-2 ${isInvalid ? 'border-dark-red' : null}`}
              icon="email"
              inputType="email"
              placeholder="Email"
              value={email}
              onChange={handleEmailChange}
              onFocus={resetInvalid}
              disabled={isSigningIn}
              ref={emailInputRef}
            />
            <InputWithIcon
              className={`mb-2 ${isInvalid ? 'border-dark-red' : null}`}
              icon="password"
              inputType={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={handlePasswordChange}
              onFocus={resetInvalid}
              disabled={isSigningIn}
              toggle={{
                toggleOnIcon: 'eye',
                toggleOffIcon: 'eye',
                title: 'Show password',
                onClick: (toggled) => setShowPassword(toggled),
              }}
              ref={passwordInputRef}
            />
            {isInvalid ? (
              <div className="color-dark-red my-2">
                Invalid email or password.
              </div>
            ) : null}
            <Button
              className="btn-w-full mt-1 mb-3"
              label={isSigningIn ? 'Signing in...' : 'Sign in'}
              type="primary"
              onClick={handleSignInFormSubmit}
              disabled={isSigningIn}
            />
            <Checkbox
              name="is-ephemeral"
              label="Stay signed in"
              checked={!isEphemeral}
              disabled={isSigningIn}
              onChange={handleEphemeralChange}
            />
            {notesAndTagsCount > 0 ? (
              <Checkbox
                name="should-merge-local"
                label={`Merge local data (${notesAndTagsCount} notes and tags)`}
                checked={shouldMergeLocal}
                disabled={isSigningIn}
                onChange={handleShouldMergeChange}
              />
            ) : null}
          </div>
        </form>
        <div className="h-1px my-2 bg-border"></div>
        <button
          className="sn-dropdown-item font-bold"
          onClick={() => {
            setShowAdvanced(!showAdvanced);
          }}
        >
          <div className="flex item-center">
            Advanced options
            <Icon
              type="chevron-down"
              className="sn-icon--small color-grey-1 ml-1"
            />
          </div>
        </button>
        {showAdvanced ? (
          <div className="px-3 my-2">
            <div className="flex justify-between items-center mb-1">
              <Checkbox
                name="use-strict-signin"
                label="Use strict sign-in"
                checked={isStrictSignin}
                disabled={isSigningIn}
                onChange={handleStrictSigninChange}
              />
              <a
                href="https://standardnotes.com/help/security"
                target="_blank"
                rel="noopener noreferrer"
                title="Learn more"
              >
                <Icon type="info" className="color-neutral" />
              </a>
            </div>
            <Checkbox
              name="custom-sync-server"
              label="Custom sync server"
              checked={enableCustomServer}
              onChange={handleEnableServerChange}
              disabled={isSigningIn}
            />
            <InputWithIcon
              inputType="text"
              icon="server"
              placeholder="https://api.standardnotes.com"
              value={syncServer}
              onChange={handleSyncServerChange}
              disabled={!enableCustomServer && !isSigningIn}
            />
          </div>
        ) : null}
      </>
    );
  }
);

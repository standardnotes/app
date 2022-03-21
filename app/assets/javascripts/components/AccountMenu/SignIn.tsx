import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { isDev } from '@/utils';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { AccountMenuPane } from '.';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import { InputWithIcon } from '../InputWithIcon';
import { AdvancedOptions } from './AdvancedOptions';

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
    const [error, setError] = useState('');
    const [isEphemeral, setIsEphemeral] = useState(false);

    const [isStrictSignin, setIsStrictSignin] = useState(false);
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [shouldMergeLocal, setShouldMergeLocal] = useState(true);
    const [isVault, setIsVault] = useState(false);

    const emailInputRef = useRef<HTMLInputElement>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (emailInputRef?.current) {
        emailInputRef.current?.focus();
      }
      if (isDev && window.devAccountEmail) {
        setEmail(window.devAccountEmail);
        setPassword(window.devAccountPassword as string);
      }
    }, []);

    const resetInvalid = () => {
      if (error.length) {
        setError('');
      }
    };

    const handleEmailChange = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setEmail(e.target.value);
      }
    };

    const handlePasswordChange = (e: Event) => {
      if (error.length) {
        setError('');
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

    const signIn = () => {
      setIsSigningIn(true);
      emailInputRef?.current?.blur();
      passwordInputRef?.current?.blur();

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
          setError(err.message ?? err.toString());
          setPassword('');
          passwordInputRef?.current?.blur();
        })
        .finally(() => {
          setIsSigningIn(false);
        });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSignInFormSubmit(e);
      }
    };

    const onVaultChange = useCallback(
      (newIsVault: boolean, vaultedEmail?: string) => {
        setIsVault(newIsVault);
        if (newIsVault && vaultedEmail) {
          setEmail(vaultedEmail);
        }
      },
      [setEmail]
    );

    const handleSignInFormSubmit = (e: Event) => {
      e.preventDefault();

      if (!email || email.length === 0) {
        emailInputRef?.current?.focus();
        return;
      }

      if (!password || password.length === 0) {
        passwordInputRef?.current?.focus();
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
        <div className="px-3 mb-1">
          <InputWithIcon
            className={`mb-2 ${error ? 'border-dark-red' : null}`}
            icon="email"
            inputType="email"
            placeholder="Email"
            value={email}
            onChange={handleEmailChange}
            onFocus={resetInvalid}
            onKeyDown={handleKeyDown}
            disabled={isSigningIn || isVault}
            ref={emailInputRef}
          />
          <InputWithIcon
            className={`mb-2 ${error ? 'border-dark-red' : null}`}
            icon="password"
            inputType={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={handlePasswordChange}
            onFocus={resetInvalid}
            onKeyDown={handleKeyDown}
            disabled={isSigningIn}
            toggle={{
              toggleOnIcon: 'eye-off',
              toggleOffIcon: 'eye',
              title: 'Show password',
              toggled: showPassword,
              onClick: setShowPassword,
            }}
            ref={passwordInputRef}
          />
          {error ? <div className="color-dark-red my-2">{error}</div> : null}
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
        <div className="h-1px my-2 bg-border"></div>
        <AdvancedOptions
          appState={appState}
          application={application}
          disabled={isSigningIn}
          onVaultChange={onVaultChange}
          onStrictSignInChange={handleStrictSigninChange}
        />
      </>
    );
  }
);

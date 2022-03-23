import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { StateUpdater, useEffect, useRef, useState } from 'preact/hooks';
import { AccountMenuPane } from '.';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { InputWithIcon } from '../InputWithIcon';
import { AdvancedOptions } from './AdvancedOptions';

type Props = {
  appState: AppState;
  application: WebApplication;
  setMenuPane: (pane: AccountMenuPane) => void;
  email: string;
  setEmail: StateUpdater<string>;
  password: string;
  setPassword: StateUpdater<string>;
};

export const CreateAccount: FunctionComponent<Props> = observer(
  ({
    appState,
    application,
    setMenuPane,
    email,
    setEmail,
    password,
    setPassword,
  }) => {
    const [showPassword, setShowPassword] = useState(false);

    const emailInputRef = useRef<HTMLInputElement>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);
    const [isVault, setIsVault] = useState(false);

    useEffect(() => {
      if (emailInputRef.current) {
        emailInputRef.current?.focus();
      }
    }, []);

    const handleEmailChange = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setEmail(e.target.value);
      }
    };

    const handlePasswordChange = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setPassword(e.target.value);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleRegisterFormSubmit(e);
      }
    };

    const handleRegisterFormSubmit = (e: Event) => {
      e.preventDefault();

      if (!email || email.length === 0) {
        emailInputRef.current?.focus();
        return;
      }

      if (!password || password.length === 0) {
        passwordInputRef.current?.focus();
        return;
      }

      setEmail(email);
      setPassword(password);
      setMenuPane(AccountMenuPane.ConfirmPassword);
    };

    const handleClose = () => {
      setMenuPane(AccountMenuPane.GeneralMenu);
      setEmail('');
      setPassword('');
    };

    const onVaultChange = (isVault: boolean, vaultedEmail?: string) => {
      setIsVault(isVault);
      if (isVault && vaultedEmail) {
        setEmail(vaultedEmail);
      }
    };

    return (
      <>
        <div className="flex items-center px-3 mt-1 mb-3">
          <IconButton
            icon="arrow-left"
            title="Go back"
            className="flex mr-2 color-neutral"
            onClick={handleClose}
            focusable={true}
          />
          <div className="sn-account-menu-headline">Create account</div>
        </div>
        <form onSubmit={handleRegisterFormSubmit} className="px-3 mb-1">
          <InputWithIcon
            className="mb-2"
            icon="email"
            inputType="email"
            placeholder="Email"
            value={email}
            disabled={isVault}
            onChange={handleEmailChange}
            onKeyDown={handleKeyDown}
            ref={emailInputRef}
          />
          <InputWithIcon
            className="mb-2"
            icon="password"
            inputType={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={handlePasswordChange}
            onKeyDown={handleKeyDown}
            toggle={{
              toggleOnIcon: 'eye-off',
              toggleOffIcon: 'eye',
              title: 'Show password',
              toggled: showPassword,
              onClick: setShowPassword,
            }}
            ref={passwordInputRef}
          />
          <Button
            className="btn-w-full mt-1"
            label="Next"
            type="primary"
            onClick={handleRegisterFormSubmit}
          />
        </form>
        <div className="h-1px my-2 bg-border"></div>
        <AdvancedOptions
          application={application}
          appState={appState}
          onVaultChange={onVaultChange}
        />
      </>
    );
  }
);

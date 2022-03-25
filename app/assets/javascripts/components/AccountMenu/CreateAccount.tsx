import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { StateUpdater, useEffect, useRef, useState } from 'preact/hooks';
import { AccountMenuPane } from '.';
import { Button } from '../Button';
import { DecoratedInput } from '../DecoratedInput';
import { DecoratedPasswordInput } from '../DecoratedPasswordInput';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
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
    const emailInputRef = useRef<HTMLInputElement>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);
    const [isVault, setIsVault] = useState(false);

    useEffect(() => {
      if (emailInputRef.current) {
        emailInputRef.current?.focus();
      }
    }, []);

    const handleEmailChange = (text: string) => {
      setEmail(text);
    };

    const handlePasswordChange = (text: string) => {
      setPassword(text);
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
          <DecoratedInput
            className="mb-2"
            disabled={isVault}
            left={[<Icon type="email" className="color-neutral" />]}
            onChange={handleEmailChange}
            onKeyDown={handleKeyDown}
            placeholder="Email"
            ref={emailInputRef}
            type="email"
            value={email}
          />
          <DecoratedPasswordInput
            className="mb-2"
            left={[<Icon type="password" className="color-neutral" />]}
            onChange={handlePasswordChange}
            onKeyDown={handleKeyDown}
            placeholder="Password"
            ref={passwordInputRef}
            value={password}
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

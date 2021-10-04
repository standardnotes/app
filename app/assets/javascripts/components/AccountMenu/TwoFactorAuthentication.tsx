import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { StateUpdater, useRef, useState } from 'preact/hooks';
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

export const TwoFactorAuthentication: FunctionComponent<Props> = observer(
  ({ application, appState, setMenuPane }) => {
    const [authCode, setAuthCode] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const authCodeInputRef = useRef<HTMLInputElement>();

    const handleAuthCodeChange = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setAuthCode(e.target.value);
      }
    };

    const handleGoBack = () => {
      setMenuPane(AccountMenuPane.LogIn);
    };

    const handle2FAFormSubmit = (e: Event) => {
      e.preventDefault();
    };

    return (
      <>
        <div className="flex items-center px-3 mt-1 mb-3">
          <IconButton
            icon="arrow-left"
            title="Go back"
            className="flex mr-2 color-neutral"
            onClick={handleGoBack}
            focusable={true}
          />
          <div className="sn-account-menu-headline">Authentication</div>
        </div>
        <div className="px-3 mb-3 text-sm">
          Check your authentication app for a two-factor authentication code for
          Standard Notes (2FA).
        </div>

        <form onSubmit={handle2FAFormSubmit} className="px-3 mb-1">
          <InputWithIcon
            className="mb-2"
            icon="lock"
            inputType="text"
            placeholder="Authentication code"
            value={authCode}
            onChange={handleAuthCodeChange}
            disabled={isLoggingIn}
            ref={authCodeInputRef}
          />
          <Button
            className="btn-w-full mt-1"
            label={isLoggingIn ? 'Logging in...' : 'Log in'}
            type="primary"
            onClick={handle2FAFormSubmit}
            disabled={isLoggingIn}
          />
        </form>
      </>
    );
  }
);

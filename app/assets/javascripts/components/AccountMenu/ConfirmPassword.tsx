import { STRING_NON_MATCHING_PASSWORDS } from '@/strings';
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
  email: string;
  password: string;
  setPassword: StateUpdater<string>;
  enableCustomServer: boolean;
  setEnableCustomServer: StateUpdater<boolean>;
};

export const ConfirmPassword: FunctionComponent<Props> = observer(
  ({
    application,
    appState,
    setMenuPane,
    email,
    password,
    setPassword,
    enableCustomServer,
    setEnableCustomServer,
  }) => {
    const { notesAndTagsCount, server, setServer } = appState.accountMenu;
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [isEphemeral, setIsEphemeral] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [shouldMergeLocal, setShouldMergeLocal] = useState(true);

    const passwordInputRef = useRef<HTMLInputElement>();

    const handlePasswordChange = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setConfirmPassword(e.target.value);
      }
    };

    const handleEphemeralChange = () => {
      setIsEphemeral(!isEphemeral);
    };

    const handleShouldMergeChange = () => {
      setShouldMergeLocal(!shouldMergeLocal);
    };

    const handleEnableServerChange = () => {
      setEnableCustomServer(!enableCustomServer);
    };

    const handleSyncServerChange = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setServer(e.target.value);
        application.setCustomHost(e.target.value);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleConfirmFormSubmit(e);
      }
    };

    const handleConfirmFormSubmit = (e: Event) => {
      e.preventDefault();

      if (!password || password.length === 0) {
        passwordInputRef?.current.focus();
        return;
      }

      if (password === confirmPassword) {
        setIsRegistering(true);
        application
          .register(email, password, isEphemeral, shouldMergeLocal)
          .then((res) => {
            if (res.error) {
              throw new Error(res.error.message);
            }
            appState.accountMenu.closeAccountMenu();
            appState.accountMenu.setCurrentPane(AccountMenuPane.GeneralMenu);
          })
          .catch((err) => {
            console.error(err);
            application.alertService.alert(err).finally(() => {
              setPassword('');
              handleGoBack();
            });
          })
          .finally(() => {
            setIsRegistering(false);
          });
      } else {
        application.alertService
          .alert(STRING_NON_MATCHING_PASSWORDS)
          .finally(() => {
            setConfirmPassword('');
            passwordInputRef?.current.focus();
          });
      }
    };

    const handleGoBack = () => {
      setMenuPane(AccountMenuPane.Register);
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
            disabled={isRegistering}
          />
          <div className="sn-account-menu-headline">Confirm password</div>
        </div>
        <div className="px-3 mb-3 text-sm">
          Because your notes are encrypted using your password,{' '}
          <span className="color-dark-red">
            Standard Notes does not have a password reset option
          </span>
          . If you forget your password, you will permanently lose access to
          your data.
        </div>
        <form onSubmit={handleConfirmFormSubmit} className="px-3 mb-1">
          <InputWithIcon
            className="mb-2"
            icon="password"
            inputType={showPassword ? 'text' : 'password'}
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={handlePasswordChange}
            onKeyDown={handleKeyDown}
            toggle={{
              toggleOnIcon: 'eye',
              toggleOffIcon: 'eye',
              title: 'Show password',
              onClick: setShowPassword,
            }}
            ref={passwordInputRef}
            disabled={isRegistering}
          />
          <Button
            className="btn-w-full mt-1 mb-3"
            label={
              isRegistering ? 'Creating account...' : 'Create account & sign in'
            }
            type="primary"
            onClick={handleConfirmFormSubmit}
            disabled={isRegistering}
          />
          <Checkbox
            name="is-ephemeral"
            label="Stay signed in"
            checked={!isEphemeral}
            onChange={handleEphemeralChange}
            disabled={isRegistering}
          />
          {notesAndTagsCount > 0 ? (
            <Checkbox
              name="should-merge-local"
              label={`Merge local data (${notesAndTagsCount} notes and tags)`}
              checked={shouldMergeLocal}
              onChange={handleShouldMergeChange}
              disabled={isRegistering}
            />
          ) : null}
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
            <Checkbox
              name="custom-sync-server"
              label="Custom sync server"
              checked={enableCustomServer}
              onChange={handleEnableServerChange}
              disabled={isRegistering}
            />
            <InputWithIcon
              inputType="text"
              icon="server"
              placeholder="https://api.standardnotes.com"
              value={server}
              onChange={handleSyncServerChange}
              disabled={!enableCustomServer && !isRegistering}
            />
          </div>
        ) : null}
      </>
    );
  }
);

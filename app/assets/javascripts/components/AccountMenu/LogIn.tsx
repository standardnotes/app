import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { StateUpdater, useEffect, useRef, useState } from 'preact/hooks';
import { AccountMenuPane } from '.';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { InputWithIcon } from '../InputWithIcon';

type Props = {
  appState: AppState;
  application: WebApplication;
  setMenuPane: StateUpdater<AccountMenuPane>;
};

type CheckboxProps = {
  name: string;
  checked: boolean;
  onChange: (e: Event) => void;
  disabled: boolean;
  label: string;
};

const Checkbox: FunctionComponent<CheckboxProps> = ({
  name,
  checked,
  onChange,
  disabled,
  label,
}) => {
  return (
    <label htmlFor={name} className="flex items-center fit-content mb-2">
      <input
        className="mr-2"
        type="checkbox"
        name={name}
        id={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      {label}
    </label>
  );
};

export const LogInPane: FunctionComponent<Props> = observer(
  ({ application, appState, setMenuPane }) => {
    const { notesAndTagsCount } = appState.accountMenu;
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [syncServer, setSyncServer] = useState(
      'https://api.standardnotes.com'
    );
    const [isEphemeral, setIsEphemeral] = useState(false);
    const [isStrictLogin, setIsStrictLogin] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
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

    const handleEphemeralChange = () => {
      setIsEphemeral(!isEphemeral);
    };

    const handleStrictLoginChange = () => {
      setIsStrictLogin(!isStrictLogin);
    };

    const handleShouldMergeChange = () => {
      setShouldMergeLocal(!shouldMergeLocal);
    };

    const handleCustomServerChange = () => {
      setEnableCustomServer(!enableCustomServer);
    };

    const handleSyncServerChange = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setSyncServer(e.target.value);
        application.setCustomHost(e.target.value);
      }
    };

    const login = () => {
      setIsLoggingIn(true);
      emailInputRef?.current.blur();
      passwordInputRef?.current.blur();

      application
        .signIn(email, password, isStrictLogin, isEphemeral, shouldMergeLocal)
        .then((res) => {
          if (res.error) {
            throw new Error(res.error.message);
          }
          appState.accountMenu.closeAccountMenu();
        })
        .catch((err) => {
          console.error(err);
          application.alertService.alert(err);
          setPassword('');
          passwordInputRef?.current.blur();
        })
        .finally(() => {
          setIsLoggingIn(false);
        });
    };

    const handleLoginFormSubmit = (e: Event) => {
      e.preventDefault();

      if (!email || email.length === 0) {
        emailInputRef?.current.focus();
        return;
      }

      if (!password || password.length === 0) {
        passwordInputRef?.current.focus();
        return;
      }

      login();
    };

    return (
      <>
        <div className="flex items-center px-3 mt-1 mb-3">
          <div
            className="flex cursor-pointer mr-2"
            onClick={() => setMenuPane(AccountMenuPane.GeneralMenu)}
          >
            <Icon type="arrow-left" className="color-grey-1" />
          </div>
          <div className="sn-account-menu-headline">Login</div>
        </div>
        <form onSubmit={handleLoginFormSubmit}>
          <div className="px-3 mb-1">
            <InputWithIcon
              className="mb-2"
              icon="email"
              inputType="email"
              placeholder="Email"
              value={email}
              onChange={handleEmailChange}
              disabled={isLoggingIn}
              ref={emailInputRef}
            />
            <InputWithIcon
              className="mb-2"
              icon="password"
              inputType={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={handlePasswordChange}
              disabled={isLoggingIn}
              toggle={{
                toggleOnIcon: 'eye',
                toggleOffIcon: 'eye',
                title: 'Show password',
                onClick: (toggled) => setShowPassword(toggled),
              }}
              ref={passwordInputRef}
            />
            <Button
              className="btn-w-full mt-1 mb-3"
              label={isLoggingIn ? 'Logging in...' : 'Log in'}
              type="primary"
              onClick={handleLoginFormSubmit}
              disabled={isLoggingIn}
            />
            <Checkbox
              name="is-ephemeral"
              label="Stay logged in"
              checked={!isEphemeral}
              disabled={isLoggingIn}
              onChange={handleEphemeralChange}
            />
            {notesAndTagsCount > 0 ? (
              <Checkbox
                name="should-merge-local"
                label={`Merge local data (${notesAndTagsCount} notes and tags)`}
                checked={shouldMergeLocal}
                disabled={isLoggingIn}
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
            <Checkbox
              name="use-strict-login"
              label="Use strict login"
              checked={isStrictLogin}
              disabled={isLoggingIn}
              onChange={handleStrictLoginChange}
            />
            <Checkbox
              name="custom-sync-server"
              label="Custom sync server"
              checked={enableCustomServer}
              onChange={handleCustomServerChange}
              disabled={isLoggingIn}
            />
            <InputWithIcon
              inputType="text"
              icon="server"
              placeholder="https://api.standardnotes.com"
              value={syncServer}
              onChange={handleSyncServerChange}
              disabled={!enableCustomServer && !isLoggingIn}
            />
          </div>
        ) : null}
      </>
    );
  }
);

import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { StateUpdater, useEffect, useRef, useState } from 'preact/hooks';
import { AccountMenuPane } from '.';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Icon } from '../Icon';
import { InputWithIcon } from '../InputWithIcon';

type Props = {
  appState: AppState;
  application: WebApplication;
  setMenuPane: StateUpdater<AccountMenuPane>;
};

export const CreateAccount: FunctionComponent<Props> = observer(
  ({ application, appState, setMenuPane }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [syncServer, setSyncServer] = useState(
      'https://api.standardnotes.com'
    );
    const [enableCustomServer, setEnableCustomServer] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

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

    const handleCustomServerChange = () => {
      setEnableCustomServer(!enableCustomServer);
    };

    const handleSyncServerChange = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setSyncServer(e.target.value);
        application.setCustomHost(e.target.value);
      }
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
          <div className="sn-account-menu-headline">Create account</div>
        </div>
        <div className="px-3 mb-1">
          <InputWithIcon
            className="mb-2"
            icon="email"
            inputType="email"
            placeholder="Email"
            value={email}
            onChange={handleEmailChange}
            ref={emailInputRef}
          />
          <InputWithIcon
            className="mb-2"
            icon="password"
            inputType={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={handlePasswordChange}
            toggle={{
              toggleOnIcon: 'eye',
              toggleOffIcon: 'eye',
              title: 'Show password',
              onClick: (toggled) => setShowPassword(toggled),
            }}
            ref={passwordInputRef}
          />
          <Button
            className="btn-w-full mt-1"
            label="Next"
            type="primary"
            onClick={() => {
              /** @TODO */
            }}
          />
        </div>
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
              className="sn-icon--small color-grey-1 ml-2"
            />
          </div>
        </button>
        {showAdvanced ? (
          <div className="px-3 mt-2">
            <Checkbox
              name="custom-sync-server"
              label="Custom sync server"
              checked={enableCustomServer}
              onChange={handleCustomServerChange}
            />
            <InputWithIcon
              inputType="text"
              icon="server"
              placeholder="https://api.standardnotes.com"
              value={syncServer}
              onChange={handleSyncServerChange}
              disabled={!enableCustomServer}
            />
          </div>
        ) : null}
      </>
    );
  }
);

import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { Checkbox } from '../Checkbox';
import { Icon } from '../Icon';
import { InputWithIcon } from '../InputWithIcon';

type Props = {
  application: WebApplication;
  appState: AppState;
  disabled?: boolean;
};

export const AdvancedOptions: FunctionComponent<Props> = ({
  appState,
  application,
  disabled,
  children,
}) => {
  const { server, setServer } = appState.accountMenu;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [enableCustomServer, setEnableCustomServer] = useState(false);

  const handleEnableServerChange = () => {
    setEnableCustomServer(!enableCustomServer);
  };

  const handleSyncServerChange = (e: Event) => {
    if (e.target instanceof HTMLInputElement) {
      setServer(e.target.value);
      application.setCustomHost(e.target.value);
    }
  };

  const toggleShowAdvanced = () => {
    setShowAdvanced(!showAdvanced);
  };

  return (
    <>
      <button
        className="sn-dropdown-item font-bold"
        onClick={toggleShowAdvanced}
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
          {children}
          <Checkbox
            name="custom-sync-server"
            label="Custom sync server"
            checked={enableCustomServer}
            onChange={handleEnableServerChange}
            disabled={disabled}
          />
          <InputWithIcon
            inputType="text"
            icon="server"
            placeholder="https://api.standardnotes.com"
            value={server}
            onChange={handleSyncServerChange}
            disabled={!enableCustomServer && !disabled}
          />
        </div>
      ) : null}
    </>
  );
};

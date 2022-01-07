import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { isDev } from '@/utils';
import { observer } from 'mobx-react-lite';
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

export const AdvancedOptions: FunctionComponent<Props> = observer(
  ({ appState, application, disabled = false, children }) => {
    const { server, setServer, enableServerOption, setEnableServerOption } =
      appState.accountMenu;
    const [showAdvanced, setShowAdvanced] = useState(false);

    if (isDev && window._devAccountServer) {
      setEnableServerOption(true);
      setServer(window._devAccountServer);
      application.setCustomHost(window._devAccountServer);
    }

    const handleServerOptionChange = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setEnableServerOption(e.target.checked);
      }
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
          className="sn-dropdown-item focus:bg-info-backdrop focus:shadow-none font-bold"
          onClick={toggleShowAdvanced}
        >
          <div className="flex items-center">
            Advanced options
            <Icon type="chevron-down" className="color-grey-1 ml-1" />
          </div>
        </button>
        {showAdvanced ? (
          <div className="px-3 my-2">
            {children}
            <Checkbox
              name="custom-sync-server"
              label="Custom sync server"
              checked={enableServerOption}
              onChange={handleServerOptionChange}
              disabled={disabled}
            />
            <InputWithIcon
              inputType="text"
              icon="server"
              placeholder="https://api.standardnotes.com"
              value={server}
              onChange={handleSyncServerChange}
              disabled={!enableServerOption && !disabled}
            />
          </div>
        ) : null}
      </>
    );
  }
);

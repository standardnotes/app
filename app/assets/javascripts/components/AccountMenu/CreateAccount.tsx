import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { StateUpdater, useState } from 'preact/hooks';
import { AccountMenuPane } from '.';
import { Button } from '../Button';
import { Icon } from '../Icon';

type Props = {
  appState: AppState;
  application: WebApplication;
  setMenuPane: StateUpdater<AccountMenuPane>;
};

export const CreateAccount: FunctionComponent<Props> = observer(
  ({ application, appState, setMenuPane }) => {
    const [showAdvanced, setShowAdvanced] = useState(false);

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
          <input
            className="sk-input contrast"
            type="email"
            name="email"
            placeholder="Email"
          />
          <input
            className="sk-input contrast"
            type="password"
            name="password"
            placeholder="Password"
          />
          <Button
            className="btn-w-full mt-1"
            label="Next"
            type="primary"
            onClick={() => {
              //
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
            <label
              htmlFor="custom-sync-server"
              className="flex item-center mb-1"
            >
              <input
                className="mr-2"
                type="checkbox"
                name="custom-sync-server"
                id="custom-sync-server"
              />
              Custom sync server
            </label>
            <input
              className="sk-input contrast"
              type="text"
              name="sync-server"
              placeholder="https://sync.standardnotes.org"
            />
          </div>
        ) : null}
      </>
    );
  }
);

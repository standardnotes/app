import { observer } from 'mobx-react-lite';
import { toDirective } from '@/components/utils';
import { AppState } from '@/ui_models/app_state';
import { WebApplication } from '@/ui_models/application';
import { StateUpdater, useState } from 'preact/hooks';
import { GeneralAccountMenu } from './GeneralAccountMenu';
import { FunctionComponent } from 'preact';
import { LogInPane } from './LogIn';
import { CreateAccount } from './CreateAccount';
import { ConfirmSignoutContainer } from '../ConfirmSignoutModal';

export enum AccountMenuPane {
  GeneralMenu,
  LogIn,
  Register,
  ConfirmPassword,
  TwoFactor,
}

type Props = {
  appState: AppState;
  application: WebApplication;
};

type PaneSelectorProps = Props & {
  menuPane: AccountMenuPane;
  setMenuPane: StateUpdater<AccountMenuPane>;
};

const MenuPaneSelector: FunctionComponent<PaneSelectorProps> = observer(
  ({ application, appState, menuPane, setMenuPane }) => {
    switch (menuPane) {
      case AccountMenuPane.GeneralMenu:
        return (
          <GeneralAccountMenu
            appState={appState}
            application={application}
            setMenuPane={setMenuPane}
          />
        );
      case AccountMenuPane.LogIn:
        return (
          <LogInPane
            appState={appState}
            application={application}
            setMenuPane={setMenuPane}
          />
        );
      case AccountMenuPane.Register:
        return (
          <CreateAccount
            appState={appState}
            application={application}
            setMenuPane={setMenuPane}
          />
        );
      case AccountMenuPane.ConfirmPassword:
      case AccountMenuPane.TwoFactor:
        return null;
    }
  }
);

const AccountMenu: FunctionComponent<Props> = observer(
  ({ application, appState }) => {
    const [accountMenuState, setAccountMenuState] = useState<AccountMenuPane>(
      AccountMenuPane.GeneralMenu
    );

    return (
      <div className="sn-component">
        <div className="sn-account-menu sn-dropdown sn-dropdown--animated min-w-80 max-h-120 max-w-xs flex flex-col py-2 overflow-y-auto absolute">
          <MenuPaneSelector
            appState={appState}
            application={application}
            menuPane={accountMenuState}
            setMenuPane={setAccountMenuState}
          />
        </div>
        <ConfirmSignoutContainer
          appState={appState}
          application={application}
        />
      </div>
    );
  }
);

export const AccountMenuDirective = toDirective<Props>(AccountMenu);

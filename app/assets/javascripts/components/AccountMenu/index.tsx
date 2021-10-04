import { observer } from 'mobx-react-lite';
import { toDirective } from '@/components/utils';
import { AppState } from '@/ui_models/app_state';
import { WebApplication } from '@/ui_models/application';
import { useState } from 'preact/hooks';
import { GeneralAccountMenu } from './GeneralAccountMenu';
import { FunctionComponent } from 'preact';
import { LogInPane } from './LogIn';
import { CreateAccount } from './CreateAccount';
import { ConfirmSignoutContainer } from '../ConfirmSignoutModal';
import { ConfirmPassword } from './ConfirmPassword';

export enum AccountMenuPane {
  GeneralMenu,
  LogIn,
  Register,
  ConfirmPassword,
}

type Props = {
  appState: AppState;
  application: WebApplication;
};

type PaneSelectorProps = Props & {
  menuPane: AccountMenuPane;
  setMenuPane: (pane: AccountMenuPane) => void;
};

const MenuPaneSelector: FunctionComponent<PaneSelectorProps> = observer(
  ({ application, appState, menuPane, setMenuPane }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

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
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
          />
        );
      case AccountMenuPane.ConfirmPassword:
        return (
          <ConfirmPassword
            appState={appState}
            application={application}
            setMenuPane={setMenuPane}
            email={email}
            password={password}
            setPassword={setPassword}
          />
        );
    }
  }
);

const AccountMenu: FunctionComponent<Props> = observer(
  ({ application, appState }) => {
    const { currentPane, setCurrentPane } = appState.accountMenu;

    return (
      <div className="sn-component">
        <div className="sn-account-menu sn-dropdown sn-dropdown--animated min-w-80 max-h-120 max-w-xs flex flex-col py-2 overflow-y-auto absolute">
          <MenuPaneSelector
            appState={appState}
            application={application}
            menuPane={currentPane}
            setMenuPane={setCurrentPane}
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

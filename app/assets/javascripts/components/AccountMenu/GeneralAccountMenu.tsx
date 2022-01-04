import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { Icon } from '../Icon';
import { formatLastSyncDate } from '@/preferences/panes/account/Sync';
import { SyncQueueStrategy } from '@standardnotes/snjs';
import { STRING_GENERIC_SYNC_ERROR } from '@/strings';
import { useState } from 'preact/hooks';
import { AccountMenuPane } from '.';
import { FunctionComponent } from 'preact';
import { Menu } from '../menu/Menu';
import { MenuItem, MenuItemSeparator, MenuItemType } from '../menu/MenuItem';

type Props = {
  appState: AppState;
  application: WebApplication;
  setMenuPane: (pane: AccountMenuPane) => void;
  closeMenu: () => void;
};

const iconClassName = 'color-neutral mr-2';

export const GeneralAccountMenu: FunctionComponent<Props> = observer(
  ({ application, appState, setMenuPane, closeMenu }) => {
    const [isSyncingInProgress, setIsSyncingInProgress] = useState(false);
    const [lastSyncDate, setLastSyncDate] = useState(
      formatLastSyncDate(application.getLastSyncDate() as Date)
    );

    const doSynchronization = async () => {
      setIsSyncingInProgress(true);

      application
        .sync({
          queueStrategy: SyncQueueStrategy.ForceSpawnNew,
          checkIntegrity: true,
        })
        .then((res) => {
          if (res && res.error) {
            throw new Error();
          } else {
            setLastSyncDate(
              formatLastSyncDate(application.getLastSyncDate() as Date)
            );
          }
        })
        .catch(() => {
          application.alertService.alert(STRING_GENERIC_SYNC_ERROR);
        })
        .finally(() => {
          setIsSyncingInProgress(false);
        });
    };

    const user = application.getUser();

    return (
      <>
        <div className="flex items-center justify-between px-3 mt-1 mb-3">
          <div className="sn-account-menu-headline">Account</div>
          <div className="flex cursor-pointer" onClick={closeMenu}>
            <Icon type="close" className="color-neutral" />
          </div>
        </div>
        {user ? (
          <>
            <div className="px-3 mb-3 color-foreground text-sm">
              <div>You're signed in as:</div>
              <div className="my-0.5 font-bold">{user.email}</div>
              <span className="color-neutral">{application.getHost()}</span>
            </div>
            <div className="flex items-start justify-between px-3 mb-2">
              {isSyncingInProgress ? (
                <div className="flex items-center color-info font-semibold">
                  <div className="sk-spinner w-5 h-5 mr-2 spinner-info"></div>
                  Syncing...
                </div>
              ) : (
                <div className="flex items-start">
                  <Icon type="check-circle" className="mr-2 success" />
                  <div>
                    <div class="font-semibold success">Last synced:</div>
                    <div class="color-text">{lastSyncDate}</div>
                  </div>
                </div>
              )}
              <div
                className="flex cursor-pointer color-grey-1"
                onClick={doSynchronization}
              >
                <Icon type="sync" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="px-3 mb-1">
              <div className="mb-3 color-foreground">
                You’re offline. Sign in to sync your notes and preferences
                across all your devices and enable end-to-end encryption.
              </div>
              <div className="flex items-center color-grey-1">
                <Icon type="cloud-off" className="mr-2" />
                <span className="font-semibold">Offline</span>
              </div>
            </div>
          </>
        )}
        <div className="h-1px my-2 bg-border"></div>
        <Menu a11yLabel="General account menu" closeMenu={closeMenu}>
          {user ? (
            <MenuItem
              type={MenuItemType.IconButton}
              onClick={() => {
                appState.accountMenu.closeAccountMenu();
                appState.preferences.setCurrentPane('account');
                appState.preferences.openPreferences();
              }}
            >
              <Icon type="user" className={iconClassName} />
              Account settings
            </MenuItem>
          ) : (
            <>
              <MenuItem
                type={MenuItemType.IconButton}
                onClick={() => {
                  setMenuPane(AccountMenuPane.Register);
                }}
              >
                <Icon type="user" className={iconClassName} />
                Create free account
              </MenuItem>
              <MenuItem
                type={MenuItemType.IconButton}
                onClick={() => {
                  setMenuPane(AccountMenuPane.SignIn);
                }}
              >
                <Icon type="signIn" className={iconClassName} />
                Sign in
              </MenuItem>
            </>
          )}
          <MenuItem
            className="justify-between"
            type={MenuItemType.IconButton}
            onClick={() => {
              appState.accountMenu.closeAccountMenu();
              appState.preferences.setCurrentPane('help-feedback');
              appState.preferences.openPreferences();
            }}
          >
            <div className="flex items-center">
              <Icon type="help" className={iconClassName} />
              Help &amp; feedback
            </div>
            <span className="color-neutral">v{appState.version}</span>
          </MenuItem>
          {user ? (
            <>
              <MenuItemSeparator />
              <MenuItem
                type={MenuItemType.IconButton}
                onClick={() => {
                  appState.accountMenu.setSigningOut(true);
                }}
              >
                <Icon type="signOut" className={iconClassName} />
                Sign out and clear local data
              </MenuItem>
            </>
          ) : null}
        </Menu>
      </>
    );
  }
);

import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'
import { observer } from 'mobx-react-lite'
import { Icon } from '@/Components/Icon'
import { formatLastSyncDate } from '@/Components/Preferences/Panes/Account/Sync'
import { SyncQueueStrategy } from '@standardnotes/snjs'
import { STRING_GENERIC_SYNC_ERROR } from '@/Strings'
import { useCallback, useMemo, useState } from 'preact/hooks'
import { AccountMenuPane } from '.'
import { FunctionComponent } from 'preact'
import { Menu } from '@/Components/Menu/Menu'
import { MenuItem, MenuItemSeparator, MenuItemType } from '@/Components/Menu/MenuItem'
import { WorkspaceSwitcherOption } from './WorkspaceSwitcher/WorkspaceSwitcherOption'
import { ApplicationGroup } from '@/UIModels/ApplicationGroup'

type Props = {
  appState: AppState
  application: WebApplication
  mainApplicationGroup: ApplicationGroup
  setMenuPane: (pane: AccountMenuPane) => void
  closeMenu: () => void
}

const iconClassName = 'color-neutral mr-2'

export const GeneralAccountMenu: FunctionComponent<Props> = observer(
  ({ application, appState, setMenuPane, closeMenu, mainApplicationGroup }) => {
    const [isSyncingInProgress, setIsSyncingInProgress] = useState(false)
    const [lastSyncDate, setLastSyncDate] = useState(formatLastSyncDate(application.sync.getLastSyncDate() as Date))

    const doSynchronization = useCallback(async () => {
      setIsSyncingInProgress(true)

      application.sync
        .sync({
          queueStrategy: SyncQueueStrategy.ForceSpawnNew,
          checkIntegrity: true,
        })
        .then((res) => {
          if (res && (res as any).error) {
            throw new Error()
          } else {
            setLastSyncDate(formatLastSyncDate(application.sync.getLastSyncDate() as Date))
          }
        })
        .catch(() => {
          application.alertService.alert(STRING_GENERIC_SYNC_ERROR).catch(console.error)
        })
        .finally(() => {
          setIsSyncingInProgress(false)
        })
    }, [application])

    const user = useMemo(() => application.getUser(), [application])

    const openPreferences = useCallback(() => {
      appState.accountMenu.closeAccountMenu()
      appState.preferences.setCurrentPane('account')
      appState.preferences.openPreferences()
    }, [appState])

    const openHelp = useCallback(() => {
      appState.accountMenu.closeAccountMenu()
      appState.preferences.setCurrentPane('help-feedback')
      appState.preferences.openPreferences()
    }, [appState])

    const signOut = useCallback(() => {
      appState.accountMenu.setSigningOut(true)
    }, [appState])

    const activateRegisterPane = useCallback(() => {
      setMenuPane(AccountMenuPane.Register)
    }, [setMenuPane])

    const activateSignInPane = useCallback(() => {
      setMenuPane(AccountMenuPane.SignIn)
    }, [setMenuPane])

    const CREATE_ACCOUNT_INDEX = 1
    const SWITCHER_INDEX = 0

    return (
      <>
        <div className="flex items-center justify-between px-3 mt-1 mb-1">
          <div className="sn-account-menu-headline">Account</div>
          <div className="flex cursor-pointer" onClick={closeMenu}>
            <Icon type="close" className="color-neutral" />
          </div>
        </div>
        {user ? (
          <>
            <div className="px-3 mb-3 color-foreground text-sm">
              <div>You're signed in as:</div>
              <div className="my-0.5 font-bold wrap">{user.email}</div>
              <span className="color-neutral">{application.getHost()}</span>
            </div>
            <div className="flex items-start justify-between px-3 mb-3">
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
              <div className="flex cursor-pointer color-grey-1" onClick={doSynchronization}>
                <Icon type="sync" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="px-3 mb-1">
              <div className="mb-3 color-foreground">
                You’re offline. Sign in to sync your notes and preferences across all your devices and enable end-to-end
                encryption.
              </div>
              <div className="flex items-center color-grey-1">
                <Icon type="cloud-off" className="mr-2" />
                <span className="font-semibold">Offline</span>
              </div>
            </div>
          </>
        )}
        <Menu
          isOpen={appState.accountMenu.show}
          a11yLabel="General account menu"
          closeMenu={closeMenu}
          initialFocus={!application.hasAccount() ? CREATE_ACCOUNT_INDEX : SWITCHER_INDEX}
        >
          <MenuItemSeparator />
          <WorkspaceSwitcherOption mainApplicationGroup={mainApplicationGroup} appState={appState} />
          <MenuItemSeparator />
          {user ? (
            <MenuItem type={MenuItemType.IconButton} onClick={openPreferences}>
              <Icon type="user" className={iconClassName} />
              Account settings
            </MenuItem>
          ) : (
            <>
              <MenuItem type={MenuItemType.IconButton} onClick={activateRegisterPane}>
                <Icon type="user" className={iconClassName} />
                Create free account
              </MenuItem>
              <MenuItem type={MenuItemType.IconButton} onClick={activateSignInPane}>
                <Icon type="signIn" className={iconClassName} />
                Sign in
              </MenuItem>
            </>
          )}
          <MenuItem className="justify-between" type={MenuItemType.IconButton} onClick={openHelp}>
            <div className="flex items-center">
              <Icon type="help" className={iconClassName} />
              Help &amp; feedback
            </div>
            <span className="color-neutral">v{appState.version}</span>
          </MenuItem>
          {user ? (
            <>
              <MenuItemSeparator />
              <MenuItem type={MenuItemType.IconButton} onClick={signOut}>
                <Icon type="signOut" className={iconClassName} />
                Sign out workspace
              </MenuItem>
            </>
          ) : null}
        </Menu>
      </>
    )
  },
)

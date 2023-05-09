import { WebApplication } from '@/Application/WebApplication'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import Icon from '@/Components/Icon/Icon'
import { SyncQueueStrategy } from '@standardnotes/snjs'
import { STRING_GENERIC_SYNC_ERROR } from '@/Constants/Strings'
import { useCallback, useMemo, useState, FunctionComponent } from 'react'
import { AccountMenuPane } from './AccountMenuPane'
import Menu from '@/Components/Menu/Menu'
import MenuItem from '@/Components/Menu/MenuItem'
import MenuItemSeparator from '@/Components/Menu/MenuItemSeparator'
import WorkspaceSwitcherOption from './WorkspaceSwitcher/WorkspaceSwitcherOption'
import { WebApplicationGroup } from '@/Application/WebApplicationGroup'
import { formatLastSyncDate } from '@/Utils/DateUtils'
import Spinner from '@/Components/Spinner/Spinner'
import { MenuItemIconSize } from '@/Constants/TailwindClassNames'

type Props = {
  viewControllerManager: ViewControllerManager
  application: WebApplication
  mainApplicationGroup: WebApplicationGroup
  setMenuPane: (pane: AccountMenuPane) => void
  closeMenu: () => void
}

const iconClassName = `text-neutral mr-2 ${MenuItemIconSize}`

const GeneralAccountMenu: FunctionComponent<Props> = ({
  application,
  viewControllerManager,
  setMenuPane,
  closeMenu,
  mainApplicationGroup,
}) => {
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
    viewControllerManager.accountMenuController.closeAccountMenu()
    viewControllerManager.preferencesController.setCurrentPane('account')
    viewControllerManager.preferencesController.openPreferences()
  }, [viewControllerManager])

  const openHelp = useCallback(() => {
    viewControllerManager.accountMenuController.closeAccountMenu()
    viewControllerManager.preferencesController.setCurrentPane('help-feedback')
    viewControllerManager.preferencesController.openPreferences()
  }, [viewControllerManager])

  const signOut = useCallback(() => {
    viewControllerManager.accountMenuController.setSigningOut(true)
  }, [viewControllerManager])

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
      <div className="mt-1 mb-1 hidden items-center justify-between px-3 md:flex">
        <div className="text-lg font-bold lg:text-base">Account</div>
        <div className="flex cursor-pointer" onClick={closeMenu}>
          <Icon type="close" className="text-neutral" />
        </div>
      </div>
      {user ? (
        <>
          <div className="mb-3 px-3 text-lg text-foreground lg:text-sm">
            <div>You're signed in as:</div>
            <div className="wrap my-0.5 font-bold">{user.email}</div>
            <span className="text-neutral">{application.getHost()}</span>
          </div>
          <div className="mb-2 flex items-start justify-between px-3 text-mobile-menu-item md:text-tablet-menu-item lg:text-menu-item">
            {isSyncingInProgress ? (
              <div className="flex items-center font-semibold text-info">
                <Spinner className="mr-2 h-5 w-5" />
                Syncing...
              </div>
            ) : (
              <div className="flex items-start">
                <Icon type="check-circle" className={`mr-2 text-success ${MenuItemIconSize}`} />
                <div>
                  <div className="font-semibold text-success">Last synced:</div>
                  <div className="text-text">{lastSyncDate}</div>
                </div>
              </div>
            )}
            <div className="flex cursor-pointer text-passive-1" onClick={doSynchronization}>
              <Icon type="sync" className={`${MenuItemIconSize}`} />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mb-1 px-3">
            <div className="mb-3 text-base text-foreground lg:text-sm">
              You’re offline. Sign in to sync your notes and preferences across all your devices and enable end-to-end
              encryption.
            </div>
            <div className="flex items-center text-passive-1">
              <Icon type="cloud-off" className={`mr-2 ${MenuItemIconSize}`} />
              <span className="text-lg font-semibold lg:text-sm">Offline</span>
            </div>
          </div>
        </>
      )}
      <Menu
        isOpen={viewControllerManager.accountMenuController.show}
        a11yLabel="General account menu"
        closeMenu={closeMenu}
        initialFocus={!application.hasAccount() ? CREATE_ACCOUNT_INDEX : SWITCHER_INDEX}
      >
        <MenuItemSeparator />
        <WorkspaceSwitcherOption
          mainApplicationGroup={mainApplicationGroup}
          viewControllerManager={viewControllerManager}
        />
        <MenuItemSeparator />
        {user ? (
          <MenuItem onClick={openPreferences}>
            <Icon type="user" className={iconClassName} />
            Account settings
          </MenuItem>
        ) : (
          <>
            <MenuItem onClick={activateRegisterPane}>
              <Icon type="user" className={iconClassName} />
              Create free account
            </MenuItem>
            <MenuItem onClick={activateSignInPane}>
              <Icon type="signIn" className={iconClassName} />
              Sign in
            </MenuItem>
          </>
        )}
        <MenuItem
          onClick={() => {
            viewControllerManager.importModalController.setIsVisible(true)
            viewControllerManager.accountMenuController.closeAccountMenu()
          }}
        >
          <Icon type="archive" className={iconClassName} />
          Import
        </MenuItem>
        <MenuItem className="justify-between" onClick={openHelp}>
          <div className="flex items-center">
            <Icon type="help" className={iconClassName} />
            Help &amp; feedback
          </div>
          <span className="text-neutral">v{application.version}</span>
        </MenuItem>
        {user ? (
          <>
            <MenuItemSeparator />
            <MenuItem onClick={signOut}>
              <Icon type="signOut" className={iconClassName} />
              Sign out workspace
            </MenuItem>
          </>
        ) : null}
      </Menu>
    </>
  )
}

export default observer(GeneralAccountMenu)

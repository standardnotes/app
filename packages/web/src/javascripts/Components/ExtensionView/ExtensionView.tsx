import { ApplicationGroup } from '@/Application/ApplicationGroup'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { SNLogoIcon } from '@standardnotes/icons'
import { useCallback, useState } from 'react'
import { AccountMenuPane } from '../AccountMenu/AccountMenuPane'
import MenuPaneSelector from '../AccountMenu/MenuPaneSelector'
import { useApplication } from '../ApplicationProvider'
import Icon from '../Icon/Icon'
import Menu from '../Menu/Menu'
import MenuItem from '../Menu/MenuItem'

type Props = {
  viewControllerManager: ViewControllerManager
  applicationGroup: ApplicationGroup
}

const ExtensionView = ({ viewControllerManager, applicationGroup }: Props) => {
  const application = useApplication()

  const user = application.getUser()

  const [menuPane, setMenuPane] = useState<AccountMenuPane>()

  const activateRegisterPane = useCallback(() => {
    setMenuPane(AccountMenuPane.Register)
  }, [setMenuPane])

  const activateSignInPane = useCallback(() => {
    setMenuPane(AccountMenuPane.SignIn)
  }, [setMenuPane])

  return (
    <>
      <div className="flex items-center bg-info p-1 px-3 py-2 text-base font-semibold text-info-contrast">
        <SNLogoIcon className="mr-2 h-6 w-6 fill-info-contrast stroke-info-contrast [fill-rule:evenodd]" />
        Standard Notes
      </div>
      {!user && !menuPane && (
        <Menu a11yLabel="User account menu" isOpen={true}>
          <MenuItem onClick={activateRegisterPane}>
            <Icon type="user" className="mr-2 h-6 w-6 text-neutral md:h-5 md:w-5" />
            Create free account
          </MenuItem>
          <MenuItem onClick={activateSignInPane}>
            <Icon type="signIn" className="mr-2 h-6 w-6 text-neutral md:h-5 md:w-5" />
            Sign in
          </MenuItem>
        </Menu>
      )}
      {!!menuPane && (
        <MenuPaneSelector
          viewControllerManager={viewControllerManager}
          application={application}
          mainApplicationGroup={applicationGroup}
          menuPane={menuPane}
          setMenuPane={setMenuPane}
          closeMenu={() => setMenuPane(undefined)}
        />
      )}
      {user && (
        <div>
          <div className="px-3 py-2 text-base font-semibold">Web Clipper</div>
          <Menu a11yLabel="Clipping menu" isOpen={true}>
            <MenuItem>Clip full page</MenuItem>
            <MenuItem>Clip article</MenuItem>
            <MenuItem>Clip visible area</MenuItem>
            <MenuItem>Clip current selection</MenuItem>
            <MenuItem>Select nodes to clip</MenuItem>
          </Menu>
        </div>
      )}
    </>
  )
}

export default ExtensionView

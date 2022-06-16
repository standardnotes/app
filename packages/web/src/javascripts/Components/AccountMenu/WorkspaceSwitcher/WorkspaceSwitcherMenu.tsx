import { ApplicationGroup } from '@/Application/ApplicationGroup'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { ApplicationDescriptor, ApplicationGroupEvent, ButtonType } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import Menu from '@/Components/Menu/Menu'
import MenuItem from '@/Components/Menu/MenuItem'
import MenuItemSeparator from '@/Components/Menu/MenuItemSeparator'
import { MenuItemType } from '@/Components/Menu/MenuItemType'
import WorkspaceMenuItem from './WorkspaceMenuItem'

type Props = {
  mainApplicationGroup: ApplicationGroup
  viewControllerManager: ViewControllerManager
  isOpen: boolean
  hideWorkspaceOptions?: boolean
}

const WorkspaceSwitcherMenu: FunctionComponent<Props> = ({
  mainApplicationGroup,
  viewControllerManager,
  isOpen,
  hideWorkspaceOptions = false,
}: Props) => {
  const [applicationDescriptors, setApplicationDescriptors] = useState<ApplicationDescriptor[]>([])

  useEffect(() => {
    const applicationDescriptors = mainApplicationGroup.getDescriptors()
    setApplicationDescriptors(applicationDescriptors)

    const removeAppGroupObserver = mainApplicationGroup.addEventObserver((event) => {
      if (event === ApplicationGroupEvent.DescriptorsDataChanged) {
        const applicationDescriptors = mainApplicationGroup.getDescriptors()
        setApplicationDescriptors(applicationDescriptors)
      }
    })

    return () => {
      removeAppGroupObserver()
    }
  }, [mainApplicationGroup])

  const signoutAll = useCallback(async () => {
    const confirmed = await viewControllerManager.application.alertService.confirm(
      'Are you sure you want to sign out of all workspaces on this device?',
      undefined,
      'Sign out all',
      ButtonType.Danger,
    )
    if (!confirmed) {
      return
    }
    mainApplicationGroup.signOutAllWorkspaces().catch(console.error)
  }, [mainApplicationGroup, viewControllerManager])

  const destroyWorkspace = useCallback(() => {
    viewControllerManager.accountMenuController.setSigningOut(true)
  }, [viewControllerManager])

  return (
    <Menu a11yLabel="Workspace switcher menu" className="px-0 focus:shadow-none" isOpen={isOpen}>
      {applicationDescriptors.map((descriptor) => (
        <WorkspaceMenuItem
          key={descriptor.identifier}
          descriptor={descriptor}
          hideOptions={hideWorkspaceOptions}
          onDelete={destroyWorkspace}
          onClick={() => void mainApplicationGroup.unloadCurrentAndActivateDescriptor(descriptor)}
          renameDescriptor={(label: string) => mainApplicationGroup.renameDescriptor(descriptor, label)}
        />
      ))}
      <MenuItemSeparator />

      <MenuItem
        type={MenuItemType.IconButton}
        onClick={() => {
          void mainApplicationGroup.unloadCurrentAndCreateNewDescriptor()
        }}
      >
        <Icon type="user-add" className="color-neutral mr-2" />
        Add another workspace
      </MenuItem>

      {!hideWorkspaceOptions && (
        <MenuItem type={MenuItemType.IconButton} onClick={signoutAll}>
          <Icon type="signOut" className="color-neutral mr-2" />
          Sign out all workspaces
        </MenuItem>
      )}
    </Menu>
  )
}

export default observer(WorkspaceSwitcherMenu)

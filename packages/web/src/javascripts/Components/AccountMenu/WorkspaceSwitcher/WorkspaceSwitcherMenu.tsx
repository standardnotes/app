import { ApplicationGroup } from '@/Application/ApplicationGroup'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { ApplicationDescriptor, ApplicationGroupEvent, ButtonType } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import Menu from '@/Components/Menu/Menu'
import MenuItem from '@/Components/Menu/MenuItem'
import MenuItemSeparator from '@/Components/Menu/MenuItemSeparator'
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
  const [applicationDescriptors, setApplicationDescriptors] = useState<ApplicationDescriptor[]>(
    mainApplicationGroup.getDescriptors(),
  )

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

  const activateWorkspace = useCallback(
    async (descriptor: ApplicationDescriptor) => {
      void mainApplicationGroup.unloadCurrentAndActivateDescriptor(descriptor)
    },
    [mainApplicationGroup],
  )

  const addAnotherWorkspace = useCallback(async () => {
    void mainApplicationGroup.unloadCurrentAndCreateNewDescriptor()
  }, [mainApplicationGroup])

  return (
    <Menu a11yLabel="Workspace switcher menu" className="px-0 focus:shadow-none" isOpen={isOpen}>
      {applicationDescriptors.map((descriptor) => (
        <WorkspaceMenuItem
          key={descriptor.identifier}
          descriptor={descriptor}
          hideOptions={hideWorkspaceOptions}
          onDelete={destroyWorkspace}
          onClick={() => activateWorkspace(descriptor)}
          renameDescriptor={(label: string) => mainApplicationGroup.renameDescriptor(descriptor, label)}
        />
      ))}
      <MenuItemSeparator />

      <MenuItem onClick={addAnotherWorkspace}>
        <Icon type="user-add" className="mr-2 text-neutral" />
        Add another workspace
      </MenuItem>

      {!hideWorkspaceOptions && (
        <MenuItem onClick={signoutAll}>
          <Icon type="signOut" className="mr-2 text-neutral" />
          Sign out all workspaces
        </MenuItem>
      )}
    </Menu>
  )
}

export default observer(WorkspaceSwitcherMenu)

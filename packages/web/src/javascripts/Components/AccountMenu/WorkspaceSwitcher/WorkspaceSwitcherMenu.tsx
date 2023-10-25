import { WebApplicationGroup } from '@/Application/WebApplicationGroup'
import { ApplicationDescriptor, ApplicationGroupEvent, ButtonType } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import Menu from '@/Components/Menu/Menu'
import MenuItem from '@/Components/Menu/MenuItem'
import WorkspaceMenuItem from './WorkspaceMenuItem'
import { useApplication } from '@/Components/ApplicationProvider'
import MenuSection from '@/Components/Menu/MenuSection'

type Props = {
  mainApplicationGroup: WebApplicationGroup
  hideWorkspaceOptions?: boolean
}

const WorkspaceSwitcherMenu: FunctionComponent<Props> = ({
  mainApplicationGroup,
  hideWorkspaceOptions = false,
}: Props) => {
  const application = useApplication()

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
    const confirmed = await application.alerts.confirm(
      'Are you sure you want to sign out of all workspaces on this device?',
      undefined,
      'Sign out all',
      ButtonType.Danger,
    )
    if (!confirmed) {
      return
    }
    mainApplicationGroup.signOutAllWorkspaces().catch(console.error)
  }, [mainApplicationGroup, application])

  const destroyWorkspace = useCallback(() => {
    application.accountMenuController.setSigningOut(true)
  }, [application])

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
    <Menu a11yLabel="Workspace switcher menu" className="focus:shadow-none">
      <MenuSection>
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
      </MenuSection>

      <MenuSection>
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
      </MenuSection>
    </Menu>
  )
}

export default observer(WorkspaceSwitcherMenu)

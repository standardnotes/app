import { ApplicationGroup } from '@/UIModels/ApplicationGroup'
import { AppState } from '@/UIModels/AppState'
import { ApplicationDescriptor, ButtonType } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'preact'
import { useCallback, useEffect, useState } from 'preact/hooks'
import { Icon } from '@/Components/Icon'
import { Menu } from '@/Components/Menu/Menu'
import { MenuItem, MenuItemSeparator, MenuItemType } from '@/Components/Menu/MenuItem'
import { WorkspaceMenuItem } from './WorkspaceMenuItem'

type Props = {
  mainApplicationGroup: ApplicationGroup
  appState: AppState
  isOpen: boolean
  hideWorkspaceOptions?: boolean
}

export const WorkspaceSwitcherMenu: FunctionComponent<Props> = observer(
  ({ mainApplicationGroup, appState, isOpen, hideWorkspaceOptions = false }) => {
    const [applicationDescriptors, setApplicationDescriptors] = useState<ApplicationDescriptor[]>([])

    useEffect(() => {
      const removeAppGroupObserver = mainApplicationGroup.addApplicationChangeObserver(() => {
        const applicationDescriptors = mainApplicationGroup.getDescriptors()
        setApplicationDescriptors(applicationDescriptors)
      })

      return () => {
        removeAppGroupObserver()
      }
    }, [mainApplicationGroup])

    const signoutAll = useCallback(async () => {
      const confirmed = await appState.application.alertService.confirm(
        'Are you sure you want to sign out of all workspaces on this device?',
        undefined,
        'Sign out all',
        ButtonType.Danger,
      )
      if (!confirmed) {
        return
      }
      mainApplicationGroup.signOutAllWorkspaces().catch(console.error)
    }, [mainApplicationGroup, appState.application.alertService])

    return (
      <Menu a11yLabel="Workspace switcher menu" className="px-0 focus:shadow-none" isOpen={isOpen}>
        {applicationDescriptors.map((descriptor) => (
          <WorkspaceMenuItem
            descriptor={descriptor}
            hideOptions={hideWorkspaceOptions}
            onDelete={() => {
              appState.accountMenu.setSigningOut(true)
            }}
            onClick={() => {
              mainApplicationGroup.loadApplicationForDescriptor(descriptor)
            }}
            renameDescriptor={(label: string) => mainApplicationGroup.renameDescriptor(descriptor, label)}
          />
        ))}
        <MenuItemSeparator />

        <MenuItem
          type={MenuItemType.IconButton}
          onClick={() => {
            mainApplicationGroup.addNewApplication()
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
  },
)

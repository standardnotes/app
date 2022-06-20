import React, { useCallback, useEffect, useState } from 'react'
import { SectionHeader } from '@Components/SectionHeader'
import { TableSection } from '@Root/Components/TableSection'
import { ApplicationDescriptor, ApplicationGroupEvent, ButtonType } from '@standardnotes/snjs'
import { useSafeApplicationGroupContext } from '@Root/Hooks/useSafeApplicationGroupContext'
import { SectionedAccessoryTableCell } from '@Components/SectionedAccessoryTableCell'
import { useSafeApplicationContext } from '@Root/Hooks/useSafeApplicationContext'
import { CustomActionSheetOption, useCustomActionSheet } from '@Style/CustomActionSheet'
import { SCREEN_INPUT_MODAL_WORKSPACE_NAME, SCREEN_SETTINGS } from '@Screens/screens'
import { useNavigation } from '@react-navigation/native'
import { ModalStackNavigationProp } from '@Root/ModalStack'

export const WorkspacesSection = () => {
  const application = useSafeApplicationContext()
  const appGroup = useSafeApplicationGroupContext()
  const navigation = useNavigation<ModalStackNavigationProp<typeof SCREEN_SETTINGS>['navigation']>()

  const [applicationDescriptors, setApplicationDescriptors] = useState<ApplicationDescriptor[]>([])

  enum WorkspaceAction {
    AddAnother = 'Add another workspace',
    Activate = 'Activate',
    Rename = 'Rename',
    Remove = 'Remove',
    SignOutAll = 'Sign out all workspaces',
  }

  useEffect(() => {
    let descriptors = appGroup.getDescriptors()
    setApplicationDescriptors(descriptors)

    const removeAppGroupObserver = appGroup.addEventObserver(event => {
      if (event === ApplicationGroupEvent.DescriptorsDataChanged) {
        descriptors = appGroup.getDescriptors()
        setApplicationDescriptors(descriptors)
      }
    })

    return () => {
      removeAppGroupObserver()
    }
  }, [appGroup])

  const { showActionSheet } = useCustomActionSheet()

  const getWorkspaceActionConfirmation = useCallback(
    async (action: WorkspaceAction): Promise<boolean> => {
      const { Info, Danger } = ButtonType
      const { AddAnother, Activate, Remove, SignOutAll } = WorkspaceAction
      let message = ''
      let buttonText = ''
      let buttonType = Info

      switch (action) {
        case Activate:
          message = 'The workspace will be ready for you when you come back.'
          buttonText = 'Quit App'
          break
        case AddAnother:
          message = 'Your new workspace will be ready for you when you come back.'
          buttonText = 'Quit App'
          break
        case SignOutAll:
          message = 'Are you sure you want to sign out of all workspaces on this device?'
          buttonText = 'Sign Out All'
          break
        case Remove:
          message =
            'This action will remove this workspace and its related data from this device. Your synced data will not be affected.'
          buttonText = 'Delete Workspace'
          buttonType = Danger
          break
        default:
          break
      }
      return application.alertService.confirm(message, undefined, buttonText, buttonType)
    },
    [WorkspaceAction, application.alertService],
  )

  const renameWorkspace = useCallback(
    async (descriptor: ApplicationDescriptor, newName: string) => {
      appGroup.renameDescriptor(descriptor, newName)
    },
    [appGroup],
  )

  const signOutWorkspace = useCallback(async () => {
    const confirmed = await getWorkspaceActionConfirmation(WorkspaceAction.Remove)

    if (!confirmed) {
      return
    }

    try {
      await application.user.signOut()
    } catch (error) {
      console.error(error)
    }
  }, [WorkspaceAction.Remove, application.user, getWorkspaceActionConfirmation])

  const openWorkspace = useCallback(
    async (descriptor: ApplicationDescriptor) => {
      const confirmed = await getWorkspaceActionConfirmation(WorkspaceAction.Activate)
      if (!confirmed) {
        return
      }

      await application.deviceInterface.clearNamespacedKeychainValue(descriptor.identifier)
      await appGroup.unloadCurrentAndActivateDescriptor(descriptor)
    },
    [WorkspaceAction.Activate, appGroup, application.deviceInterface, getWorkspaceActionConfirmation],
  )

  const getSingleWorkspaceItemOptions = useCallback(
    (descriptor: ApplicationDescriptor) => {
      const { Activate, Rename, Remove } = WorkspaceAction
      const worskspaceItemOptions: CustomActionSheetOption[] = []

      if (descriptor.primary) {
        worskspaceItemOptions.push(
          {
            text: Rename,
            callback: () => {
              navigation.navigate(SCREEN_INPUT_MODAL_WORKSPACE_NAME, {
                descriptor,
                renameWorkspace,
              })
            },
          },
          {
            text: Remove,
            destructive: true,
            callback: signOutWorkspace,
          },
        )
      } else {
        worskspaceItemOptions.push({
          text: Activate,
          callback: () => openWorkspace(descriptor),
        })
      }

      return worskspaceItemOptions
    },
    [WorkspaceAction, navigation, openWorkspace, renameWorkspace, signOutWorkspace],
  )

  const addAnotherWorkspace = useCallback(async () => {
    const confirmed = await getWorkspaceActionConfirmation(WorkspaceAction.AddAnother)
    if (!confirmed) {
      return
    }

    const activeDescriptor = applicationDescriptors.find(descriptor => descriptor.primary) as ApplicationDescriptor
    await application.deviceInterface.clearNamespacedKeychainValue(activeDescriptor.identifier)

    await appGroup.unloadCurrentAndCreateNewDescriptor()
  }, [
    WorkspaceAction.AddAnother,
    appGroup,
    application.deviceInterface,
    applicationDescriptors,
    getWorkspaceActionConfirmation,
  ])

  const signOutAllWorkspaces = useCallback(async () => {
    try {
      const confirmed = await getWorkspaceActionConfirmation(WorkspaceAction.SignOutAll)
      if (!confirmed) {
        return
      }
      await appGroup.signOutAllWorkspaces()
    } catch (error) {
      console.error(error)
    }
  }, [WorkspaceAction.SignOutAll, appGroup, getWorkspaceActionConfirmation])

  return (
    <TableSection>
      <SectionHeader title={'Workspaces'} />
      {applicationDescriptors.map((descriptor, index) => {
        return (
          <SectionedAccessoryTableCell
            onPress={() => {
              const singleItemOptions = getSingleWorkspaceItemOptions(descriptor)

              showActionSheet({
                title: '',
                options: singleItemOptions,
              })
            }}
            key={descriptor.identifier}
            text={descriptor.label}
            first={index === 0}
            selected={() => descriptor.primary}
          />
        )
      })}
      <SectionedAccessoryTableCell onPress={addAnotherWorkspace} text={WorkspaceAction.AddAnother} key={'add-new'} />
      <SectionedAccessoryTableCell
        onPress={signOutAllWorkspaces}
        text={WorkspaceAction.SignOutAll}
        key={'sign-out-all'}
      />
    </TableSection>
  )
}

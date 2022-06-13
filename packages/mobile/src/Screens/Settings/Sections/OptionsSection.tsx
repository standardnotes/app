import { useSignedIn } from '@Lib/SnjsHelperHooks'
import { useNavigation } from '@react-navigation/native'
import { ButtonCell } from '@Root/Components/ButtonCell'
import { SectionedAccessoryTableCell } from '@Root/Components/SectionedAccessoryTableCell'
import { SectionedOptionsTableCell } from '@Root/Components/SectionedOptionsTableCell'
import { SectionHeader } from '@Root/Components/SectionHeader'
import { TableSection } from '@Root/Components/TableSection'
import { useSafeApplicationContext } from '@Root/Hooks/useSafeApplicationContext'
import { useSafeApplicationGroupContext } from '@Root/Hooks/useSafeApplicationGroupContext'
import { ModalStackNavigationProp } from '@Root/ModalStack'
import { SCREEN_INPUT_MODAL_WORKSPACE_NAME, SCREEN_MANAGE_SESSIONS, SCREEN_SETTINGS } from '@Root/Screens/screens'
import SNReactNative from '@standardnotes/react-native-utils'
import { ApplicationDescriptor, ApplicationGroupEvent, ButtonType, PrefKey } from '@standardnotes/snjs'
import { CustomActionSheetOption, useCustomActionSheet } from '@Style/CustomActionSheet'
import moment from 'moment'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Platform } from 'react-native'
import DocumentPicker from 'react-native-document-picker'
import RNFS from 'react-native-fs'

type Props = {
  title: string
  encryptionAvailable: boolean
}

export const OptionsSection = ({ title, encryptionAvailable }: Props) => {
  // Context
  const application = useSafeApplicationContext()
  const appGroup = useSafeApplicationGroupContext()

  const [signedIn] = useSignedIn()
  const navigation = useNavigation<ModalStackNavigationProp<typeof SCREEN_SETTINGS>['navigation']>()

  // State
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [lastExportDate, setLastExportDate] = useState<Date | undefined>(() =>
    application?.getLocalPreferences().getValue(PrefKey.MobileLastExportDate, undefined),
  )

  const { showActionSheet } = useCustomActionSheet()

  const [applicationDescriptors, setApplicationDescriptors] = useState<ApplicationDescriptor[]>([])

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

  const lastExportData = useMemo(() => {
    if (lastExportDate) {
      const formattedDate = moment(lastExportDate).format('lll')
      const lastExportString = `Last exported on ${formattedDate}`

      // Date is stale if more than 7 days ago
      const staleThreshold = 7 * 86400
      const stale =
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore date type issue
        (new Date() - new Date(lastExportDate)) / 1000 > staleThreshold
      return {
        lastExportString,
        stale,
      }
    }
    return {
      lastExportString: 'Your data has not yet been backed up.',
      stale: false,
    }
  }, [lastExportDate])

  const email = useMemo(() => {
    if (signedIn) {
      const user = application.getUser()
      return user?.email
    }
    return
  }, [application, signedIn])

  const exportOptions = useMemo(() => {
    return [
      {
        title: 'Encrypted',
        key: 'encrypted',
        selected: encryptionAvailable,
      },
      { title: 'Decrypted', key: 'decrypted', selected: true },
    ]
  }, [encryptionAvailable])

  const destroyLocalData = async () => {
    if (
      await application.alertService.confirm(
        'Signing out will remove all data from this device, including notes and tags. Make sure your data is synced before proceeding.',
        'Sign Out?',
        'Sign Out',
        ButtonType.Danger,
      )
    ) {
      await application.user.signOut()
    }
  }

  const exportData = useCallback(
    async (encrypted: boolean) => {
      setExporting(true)
      const result = await application.getBackupsService().export(encrypted)
      if (result) {
        const exportDate = new Date()
        setLastExportDate(exportDate)
        void application.getLocalPreferences().setUserPrefValue(PrefKey.MobileLastExportDate, exportDate)
      }
      setExporting(false)
    },
    [application],
  )

  const readImportFile = async (fileUri: string): Promise<any> => {
    return RNFS.readFile(fileUri)
      .then(result => JSON.parse(result))
      .catch(() => {
        void application.alertService.alert('Unable to open file. Ensure it is a proper JSON file and try again.')
      })
  }

  const performImport = async (data: any) => {
    const result = await application.mutator.importData(data)
    if (!result) {
      return
    } else if ('error' in result) {
      void application.alertService.alert(result.error.text)
    } else if (result.errorCount) {
      void application.alertService.alert(
        `Import complete. ${result.errorCount} items were not imported because ` +
          'there was an error decrypting them. Make sure the password is correct and try again.',
      )
    } else {
      void application.alertService.alert('Your data has been successfully imported.')
    }
  }

  const onImportPress = async () => {
    try {
      const selectedFiles = await DocumentPicker.pick({
        type: [DocumentPicker.types.plainText],
      })
      const selectedFile = selectedFiles[0]
      const selectedFileURI = Platform.OS === 'ios' ? decodeURIComponent(selectedFile.uri) : selectedFile.uri
      const data = await readImportFile(selectedFileURI)
      if (!data) {
        return
      }
      setImporting(true)
      if (data.version || data.auth_params || data.keyParams) {
        const version = data.version || data.keyParams?.version || data.auth_params?.version
        if (application.protocolService.supportedVersions().includes(version)) {
          await performImport(data)
        } else {
          void application.alertService.alert(
            'This backup file was created using an unsupported version of the application ' +
              'and cannot be imported here. Please update your application and try again.',
          )
        }
      } else {
        await performImport(data)
      }
    } finally {
      setImporting(false)
    }
  }

  const onExportPress = useCallback(
    async (option: { key: string }) => {
      const encrypted = option.key === 'encrypted'
      if (encrypted && !encryptionAvailable) {
        void application.alertService.alert(
          'You must be signed in, or have a local passcode set, to generate an encrypted export file.',
          'Not Available',
          'OK',
        )
        return
      }
      void exportData(encrypted)
    },
    [application?.alertService, encryptionAvailable, exportData],
  )

  const openManageSessions = useCallback(() => {
    navigation.push(SCREEN_MANAGE_SESSIONS)
  }, [navigation])

  enum WorkspaceAction {
    AddAnother = 'Add another workspace',
    Open = 'Open',
    Rename = 'Rename',
    Remove = 'Remove',
    SignOutAll = 'Sign out all workspaces',
  }

  const { AddAnother, Open, Rename, Remove, SignOutAll } = WorkspaceAction

  const getWorkspaceActionConfirmation = useCallback(
    async (action: WorkspaceAction): Promise<boolean> => {
      const { Info, Danger } = ButtonType
      let message = ''
      let buttonText = ''
      let buttonType = Info

      switch (action) {
        case Open:
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
    [AddAnother, Open, Remove, SignOutAll, application.alertService],
  )

  const renameWorkspace = useCallback(
    async (descriptor: ApplicationDescriptor, newName: string) => {
      appGroup.renameDescriptor(descriptor, newName)
    },
    [appGroup],
  )

  const signOutWorkspace = useCallback(async () => {
    const confirmed = await getWorkspaceActionConfirmation(Remove)

    if (!confirmed) {
      return
    }

    try {
      await application.user.signOut() // TODO: do I need to call `SNReactNative.exitApp()` here as well?
    } catch (error) {
      console.error(error)
    }
  }, [Remove, application.user, getWorkspaceActionConfirmation])

  const openWorkspace = useCallback(
    async (descriptor: ApplicationDescriptor) => {
      const confirmed = await getWorkspaceActionConfirmation(Open)
      if (!confirmed) {
        return
      }

      // await application.getInstallationService().customWipeData()
      await appGroup.unloadCurrentAndActivateDescriptor(descriptor)
      // TODO: find a way to check if there are memory leaks *without* the below call.
      SNReactNative.exitApp()
    },
    [Open, appGroup, getWorkspaceActionConfirmation],
  )

  const getSingleWorkspaceItemOptions = useCallback(
    (descriptor: ApplicationDescriptor) => {
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
          text: Open,
          callback: () => openWorkspace(descriptor),
        })
      }

      return worskspaceItemOptions
    },
    [Open, Remove, Rename, navigation, openWorkspace, renameWorkspace, signOutWorkspace],
  )

  const getActiveWorkspaceItems = useCallback(() => {
    const descriptorItemOptions: CustomActionSheetOption[] = []

    applicationDescriptors.forEach(descriptor => {
      descriptorItemOptions.push({
        text: `${descriptor.label}${descriptor.primary ? ' *' : ''}`,

        callback: async () => {
          const singleItemOptions = getSingleWorkspaceItemOptions(descriptor)

          showActionSheet({
            title: '',
            options: singleItemOptions,
          })
        },
      })
    })

    return descriptorItemOptions
  }, [applicationDescriptors, getSingleWorkspaceItemOptions, showActionSheet])

  const addAnotherWorkspace = useCallback(async () => {
    const confirmed = await getWorkspaceActionConfirmation(AddAnother)
    if (!confirmed) {
      return
    }
    // await application.getInstallationService().wipeData()
    // await application.getInstallationService().customWipeData()
    await appGroup.unloadCurrentAndCreateNewDescriptor()
    SNReactNative.exitApp()
  }, [AddAnother, appGroup, getWorkspaceActionConfirmation])

  const signOutAllWorkspaces = useCallback(async () => {
    try {
      const confirmed = await getWorkspaceActionConfirmation(SignOutAll)
      if (!confirmed) {
        return
      }
      await appGroup.signOutAllWorkspaces()
    } catch (error) {
      console.error(error)
    }
  }, [SignOutAll, appGroup, getWorkspaceActionConfirmation])

  const handleSwitchWorkspaceClick = useCallback(() => {
    const activeDescriptors = getActiveWorkspaceItems()
    const options: CustomActionSheetOption[] = [
      ...activeDescriptors,
      {
        text: AddAnother,
        callback: addAnotherWorkspace,
      },
      {
        text: SignOutAll,
        callback: signOutAllWorkspaces,
      },
    ]
    showActionSheet({ title: '', options })
  }, [AddAnother, SignOutAll, addAnotherWorkspace, getActiveWorkspaceItems, showActionSheet, signOutAllWorkspaces])

  const showDataBackupAlert = useCallback(() => {
    void application.alertService.alert(
      'Because you are using the app offline without a sync account, it is your responsibility to keep your data safe and backed up. It is recommended you export a backup of your data at least once a week, or, to sign up for a sync account so that your data is backed up automatically.',
      'No Backups Created',
      'OK',
    )
  }, [application.alertService])

  return (
    <TableSection>
      <SectionHeader title={title} />

      <ButtonCell
        testID="switchWorkspaceButton"
        leftAligned={true}
        first={true}
        title={'Switch workspace'}
        onPress={handleSwitchWorkspaceClick}
      />
      {signedIn && (
        <>
          <ButtonCell
            testID="manageSessionsButton"
            leftAligned={true}
            first={false}
            title={'Manage Sessions'}
            onPress={openManageSessions}
          />
          <ButtonCell
            testID="signOutButton"
            leftAligned={true}
            first={false}
            title={`Sign out (${email})`}
            onPress={destroyLocalData}
          />
        </>
      )}

      <ButtonCell
        testID="importData"
        first={!signedIn}
        leftAligned
        title={importing ? 'Processing...' : 'Import Data'}
        onPress={onImportPress}
      />

      <SectionedOptionsTableCell
        testID="exportData"
        leftAligned
        options={exportOptions}
        title={exporting ? 'Processing...' : 'Export Data'}
        onPress={onExportPress}
      />

      {!signedIn && (
        <SectionedAccessoryTableCell
          testID="lastExportDate"
          onPress={() => {
            if (!lastExportDate || lastExportData.stale) {
              showDataBackupAlert()
            }
          }}
          tinted={!lastExportDate || lastExportData.stale}
          text={lastExportData.lastExportString}
        />
      )}
    </TableSection>
  )
}

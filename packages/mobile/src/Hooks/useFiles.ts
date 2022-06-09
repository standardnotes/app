import { ErrorMessage } from '@Lib/constants'
import { ToastType } from '@Lib/Types'
import { useNavigation } from '@react-navigation/native'
import { useSafeApplicationContext } from '@Root/Hooks/useSafeApplicationContext'
import { SCREEN_INPUT_MODAL_FILE_NAME } from '@Root/Screens/screens'
import { TAppStackNavigationProp } from '@Root/Screens/UploadedFilesList/UploadedFileItem'
import {
  UploadedFileItemAction,
  UploadedFileItemActionType,
} from '@Root/Screens/UploadedFilesList/UploadedFileItemAction'
import { Tabs } from '@Screens/UploadedFilesList/UploadedFilesList'
import { FileDownloadProgress } from '@standardnotes/files/dist/Domain/Types/FileDownloadProgress'
import { ButtonType, ChallengeReason, ClientDisplayableError, ContentType, FileItem, SNNote } from '@standardnotes/snjs'
import { CustomActionSheetOption, useCustomActionSheet } from '@Style/CustomActionSheet'
import { useCallback, useEffect, useState } from 'react'
import { Platform } from 'react-native'
import DocumentPicker, { DocumentPickerResponse, isInProgress, pickMultiple } from 'react-native-document-picker'
import FileViewer from 'react-native-file-viewer'
import RNFS, { exists } from 'react-native-fs'
import { Asset, launchCamera, launchImageLibrary, MediaType } from 'react-native-image-picker'
import RNShare from 'react-native-share'
import Toast from 'react-native-toast-message'

type Props = {
  note: SNNote
}
type TDownloadFileAndReturnLocalPathParams = {
  file: FileItem
  saveInTempLocation?: boolean
  showSuccessToast?: boolean
}

type TUploadFileFromCameraOrImageGalleryParams = {
  uploadFromGallery?: boolean
  mediaType?: MediaType
}

export const isFileTypePreviewable = (fileType: string) => {
  const isImage = fileType.startsWith('image/')
  const isVideo = fileType.startsWith('video/')
  const isAudio = fileType.startsWith('audio/')
  const isPdf = fileType === 'application/pdf'
  const isText = fileType === 'text/plain'

  return isImage || isVideo || isAudio || isPdf || isText
}

export const useFiles = ({ note }: Props) => {
  const application = useSafeApplicationContext()

  const { showActionSheet } = useCustomActionSheet()
  const navigation = useNavigation<TAppStackNavigationProp>()

  const [attachedFiles, setAttachedFiles] = useState<FileItem[]>([])
  const [allFiles, setAllFiles] = useState<FileItem[]>([])
  const [isDownloading, setIsDownloading] = useState(false)

  const { GeneralText } = ErrorMessage
  const { Success, Info, Error } = ToastType

  const filesService = application.getFilesService()

  const reloadAttachedFiles = useCallback(() => {
    setAttachedFiles(application.items.getFilesForNote(note).sort(filesService.sortByName))
  }, [application.items, filesService.sortByName, note])

  const reloadAllFiles = useCallback(() => {
    setAllFiles(application.items.getItems<FileItem>(ContentType.File).sort(filesService.sortByName) as FileItem[])
  }, [application.items, filesService.sortByName])

  const deleteFileAtPath = useCallback(async (path: string) => {
    try {
      if (await exists(path)) {
        await RNFS.unlink(path)
      }
    } catch (err) {
      console.error(err)
    }
  }, [])

  const showDownloadToastWithProgressBar = useCallback(
    (percentComplete: number | undefined) => {
      const percentCompleteFormatted = filesService.formatCompletedPercent(percentComplete)

      Toast.show({
        type: Info,
        text1: `Downloading and decrypting file... (${percentCompleteFormatted}%)`,
        props: {
          percentComplete: percentCompleteFormatted,
        },
        autoHide: false,
      })
    },
    [Info, filesService],
  )

  const showUploadToastWithProgressBar = useCallback(
    (fileName: string, percentComplete: number | undefined) => {
      const percentCompleteFormatted = filesService.formatCompletedPercent(percentComplete)

      Toast.show({
        type: Info,
        text1: `Uploading "${fileName}"... (${percentCompleteFormatted}%)`,
        autoHide: false,
        props: {
          percentComplete: percentCompleteFormatted,
        },
      })
    },
    [Info, filesService],
  )

  const resetProgressState = useCallback(() => {
    Toast.show({
      type: Info,
      props: {
        percentComplete: 0,
      },
      onShow: Toast.hide,
    })
  }, [Info])

  const updateProgressPercentOnDownload = useCallback(
    (progress: FileDownloadProgress | undefined) => {
      showDownloadToastWithProgressBar(progress?.percentComplete)
    },
    [showDownloadToastWithProgressBar],
  )

  const downloadFileAndReturnLocalPath = useCallback(
    async ({
      file,
      saveInTempLocation = false,
      showSuccessToast = true,
    }: TDownloadFileAndReturnLocalPathParams): Promise<string | undefined> => {
      if (isDownloading) {
        return
      }
      const isGrantedStoragePermissionOnAndroid = await filesService.hasStoragePermissionOnAndroid()

      if (!isGrantedStoragePermissionOnAndroid) {
        return
      }
      setIsDownloading(true)

      try {
        showDownloadToastWithProgressBar(0)

        const path = filesService.getDestinationPath({
          fileName: file.name,
          saveInTempLocation,
        })

        await deleteFileAtPath(path)
        const response = await filesService.downloadFileInChunks(file, path, updateProgressPercentOnDownload)

        resetProgressState()

        if (response instanceof ClientDisplayableError) {
          Toast.show({
            type: Error,
            text1: 'Error',
            text2: response.text || GeneralText,
          })
          return
        }

        if (showSuccessToast) {
          Toast.show({
            type: Success,
            text1: 'Success',
            text2: 'Successfully downloaded. Press here to open the file.',
            position: 'bottom',
            onPress: async () => {
              await FileViewer.open(path, { showOpenWithDialog: true })
            },
          })
        } else {
          Toast.hide()
        }

        return path
      } catch (error) {
        Toast.show({
          type: Error,
          text1: 'Error',
          text2: 'An error occurred while downloading the file',
          onPress: Toast.hide,
        })
        return
      } finally {
        setIsDownloading(false)
      }
    },
    [
      Error,
      GeneralText,
      Success,
      deleteFileAtPath,
      filesService,
      isDownloading,
      resetProgressState,
      showDownloadToastWithProgressBar,
      updateProgressPercentOnDownload,
    ],
  )

  const cleanupTempFileOnAndroid = useCallback(
    async (downloadedFilePath: string) => {
      if (Platform.OS === 'android') {
        await deleteFileAtPath(downloadedFilePath)
      }
    },
    [deleteFileAtPath],
  )

  const shareFile = useCallback(
    async (file: FileItem) => {
      const downloadedFilePath = await downloadFileAndReturnLocalPath({
        file,
        saveInTempLocation: true,
        showSuccessToast: false,
      })
      if (!downloadedFilePath) {
        return
      }
      await application.getAppState().performActionWithoutStateChangeImpact(async () => {
        try {
          // On Android this response always returns {success: false}, there is an open issue for that:
          //  https://github.com/react-native-share/react-native-share/issues/1059
          const shareDialogResponse = await RNShare.open({
            url: `file://${downloadedFilePath}`,
            failOnCancel: false,
          })

          // On iOS the user can store files locally from "Share" screen, so we don't show "Download" option there.
          // For Android the user has a separate "Download" action for the file, therefore after the file is shared,
          // it's not needed anymore and we remove it from the storage.
          await cleanupTempFileOnAndroid(downloadedFilePath)

          if (shareDialogResponse.success) {
            Toast.show({
              type: Success,
              text1: 'Successfully exported. Press here to open the file.',
              position: 'bottom',
              onPress: async () => {
                await FileViewer.open(downloadedFilePath)
              },
            })
          }
        } catch (error) {
          Toast.show({
            type: Error,
            text1: 'An error occurred while trying to share this file',
            onPress: Toast.hide,
          })
        }
      })
    },
    [Error, Success, application, cleanupTempFileOnAndroid, downloadFileAndReturnLocalPath],
  )

  const attachFileToNote = useCallback(
    async (file: FileItem, showToastAfterAction = true) => {
      await application.items.associateFileWithNote(file, note)
      void application.sync.sync()

      if (showToastAfterAction) {
        Toast.show({
          type: Success,
          text1: 'Successfully attached file to note',
          onPress: Toast.hide,
        })
      }
    },
    [Success, application, note],
  )

  const detachFileFromNote = useCallback(
    async (file: FileItem) => {
      await application.items.disassociateFileWithNote(file, note)
      void application.sync.sync()
      Toast.show({
        type: Success,
        text1: 'Successfully detached file from note',
        onPress: Toast.hide,
      })
    },
    [Success, application, note],
  )

  const toggleFileProtection = useCallback(
    async (file: FileItem) => {
      try {
        let result: FileItem | undefined
        if (file.protected) {
          result = await application.mutator.unprotectFile(file)
        } else {
          result = await application.mutator.protectFile(file)
        }
        const isProtected = result ? result.protected : file.protected
        return isProtected
      } catch (error) {
        console.error('An error occurred: ', error)
        return file.protected
      }
    },
    [application],
  )

  const authorizeProtectedActionForFile = useCallback(
    async (file: FileItem, challengeReason: ChallengeReason) => {
      const authorizedFiles = await application.protections.authorizeProtectedActionForItems([file], challengeReason)
      return authorizedFiles.length > 0 && authorizedFiles.includes(file)
    },
    [application],
  )

  const renameFile = useCallback(
    async (file: FileItem, fileName: string) => {
      await application.items.renameFile(file, fileName)
    },
    [application],
  )

  const previewFile = useCallback(
    async (file: FileItem) => {
      let downloadedFilePath: string | undefined = ''
      try {
        const isPreviewable = isFileTypePreviewable(file.mimeType)

        if (!isPreviewable) {
          const tryToPreview = await application.alertService.confirm(
            'This file may not be previewable. Do you wish to try anyway?',
            '',
            'Try to preview',
            ButtonType.Info,
            'Cancel',
          )
          if (!tryToPreview) {
            return
          }
        }

        downloadedFilePath = await downloadFileAndReturnLocalPath({
          file,
          saveInTempLocation: true,
          showSuccessToast: false,
        })

        if (!downloadedFilePath) {
          return
        }
        await FileViewer.open(downloadedFilePath, {
          onDismiss: async () => {
            await cleanupTempFileOnAndroid(downloadedFilePath as string)
          },
        })

        return true
      } catch (error) {
        await cleanupTempFileOnAndroid(downloadedFilePath as string)
        await application.alertService.alert('An error occurred while previewing the file.')

        return false
      }
    },
    [application, cleanupTempFileOnAndroid, downloadFileAndReturnLocalPath],
  )

  const deleteFile = useCallback(
    async (file: FileItem) => {
      const shouldDelete = await application.alertService.confirm(
        `Are you sure you want to permanently delete "${file.name}"?`,
        undefined,
        'Confirm',
        ButtonType.Danger,
        'Cancel',
      )
      if (shouldDelete) {
        Toast.show({
          type: Info,
          text1: `Deleting "${file.name}"...`,
        })
        const response = await application.files.deleteFile(file)

        if (response instanceof ClientDisplayableError) {
          Toast.show({
            type: Error,
            text1: 'Error',
            text2: response.text || GeneralText,
          })
          return
        }

        Toast.show({
          type: Success,
          text1: `Successfully deleted "${file.name}"`,
        })
      }
    },
    [Error, GeneralText, Info, Success, application.alertService, application.files],
  )

  const handlePickFilesError = async (error: unknown) => {
    if (DocumentPicker.isCancel(error)) {
      // User canceled the picker, exit any dialogs or menus and move on
    } else if (isInProgress(error)) {
      Toast.show({
        type: Info,
        text2: 'Multiple pickers were opened; only the last one will be considered.',
      })
    } else {
      Toast.show({
        type: Error,
        text1: 'An error occurred while attempting to select files.',
      })
    }
  }

  const handleUploadError = async () => {
    Toast.show({
      type: Error,
      text1: 'Error',
      text2: 'An error occurred while uploading file(s).',
    })
  }

  const pickFiles = async (): Promise<DocumentPickerResponse[] | void> => {
    try {
      const selectedFiles = await pickMultiple()

      return selectedFiles
    } catch (error) {
      await handlePickFilesError(error)
    }
  }

  const uploadSingleFile = async (file: DocumentPickerResponse | Asset, size: number): Promise<FileItem | void> => {
    try {
      const fileName = filesService.getFileName(file)
      const operation = await application.files.beginNewFileUpload(size)

      if (operation instanceof ClientDisplayableError) {
        Toast.show({
          type: Error,
          text1: operation.text,
        })
        return
      }

      const initialPercentComplete = operation.getProgress().percentComplete

      showUploadToastWithProgressBar(fileName, initialPercentComplete)

      const onChunk = async (chunk: Uint8Array, index: number, isLast: boolean) => {
        await application.files.pushBytesForUpload(operation, chunk, index, isLast)
        showUploadToastWithProgressBar(fileName, operation.getProgress().percentComplete)
      }

      const fileResult = await filesService.readFile(file, onChunk)
      const fileObj = await application.files.finishUpload(operation, fileResult)

      resetProgressState()

      if (fileObj instanceof ClientDisplayableError) {
        Toast.show({
          type: Error,
          text1: fileObj.text,
        })
        return
      }
      return fileObj
    } catch (error) {
      await handleUploadError()
    }
  }

  const uploadFiles = async (): Promise<FileItem[] | void> => {
    try {
      const selectedFiles = await pickFiles()
      if (!selectedFiles || selectedFiles.length === 0) {
        return
      }
      const uploadedFiles: FileItem[] = []
      for (const file of selectedFiles) {
        if (!file.uri || !file.size) {
          continue
        }
        const fileObject = await uploadSingleFile(file, file.size)
        if (!fileObject) {
          Toast.show({
            type: Error,
            text1: 'Error',
            text2: `An error occurred while uploading ${file.name}.`,
          })
          continue
        }
        uploadedFiles.push(fileObject)

        Toast.show({ text1: `Successfully uploaded ${fileObject.name}` })
      }
      if (selectedFiles.length > 1) {
        Toast.show({ text1: 'Successfully uploaded' })
      }

      return uploadedFiles
    } catch (error) {
      await handleUploadError()
    }
  }

  const handleAttachFromCamera = (currentTab: Tabs | undefined) => {
    const options = [
      {
        text: 'Photo',
        callback: async () => {
          const uploadedFile = await uploadFileFromCameraOrImageGallery({
            mediaType: 'photo',
          })
          if (!uploadedFile) {
            return
          }
          if (shouldAttachToNote(currentTab)) {
            await attachFileToNote(uploadedFile, false)
          }
        },
      },
      {
        text: 'Video',
        callback: async () => {
          const uploadedFile = await uploadFileFromCameraOrImageGallery({
            mediaType: 'video',
          })
          if (!uploadedFile) {
            return
          }
          await attachFileToNote(uploadedFile, false)
        },
      },
    ]
    showActionSheet({
      title: 'Choose file type',
      options,
    })
  }

  const shouldAttachToNote = (currentTab: Tabs | undefined) => {
    return currentTab === undefined || currentTab === Tabs.AttachedFiles
  }

  const handlePressAttachFile = (currentTab?: Tabs) => {
    const options: CustomActionSheetOption[] = [
      {
        text: 'Attach from files',
        key: 'files',
        callback: async () => {
          const uploadedFiles = await uploadFiles()
          if (!uploadedFiles) {
            return
          }
          if (shouldAttachToNote(currentTab)) {
            uploadedFiles.forEach(file => attachFileToNote(file, false))
          }
        },
      },
      {
        text: 'Attach from Photo Library',
        key: 'library',
        callback: async () => {
          const uploadedFile = await uploadFileFromCameraOrImageGallery({
            uploadFromGallery: true,
          })
          if (!uploadedFile) {
            return
          }
          if (shouldAttachToNote(currentTab)) {
            await attachFileToNote(uploadedFile, false)
          }
        },
      },
      {
        text: 'Attach from Camera',
        key: 'camera',
        callback: async () => {
          handleAttachFromCamera(currentTab)
        },
      },
    ]
    const osSpecificOptions = Platform.OS === 'android' ? options.filter(option => option.key !== 'library') : options
    showActionSheet({
      title: 'Choose action',
      options: osSpecificOptions,
    })
  }

  const uploadFileFromCameraOrImageGallery = async ({
    uploadFromGallery = false,
    mediaType = 'photo',
  }: TUploadFileFromCameraOrImageGalleryParams): Promise<FileItem | void> => {
    try {
      const result = uploadFromGallery
        ? await launchImageLibrary({ mediaType: 'mixed' })
        : await launchCamera({ mediaType })

      if (result.didCancel || !result.assets) {
        return
      }
      const file = result.assets[0]
      const fileObject = await uploadSingleFile(file, file.fileSize || 0)
      if (!file.uri || !file.fileSize) {
        return
      }
      if (!fileObject) {
        Toast.show({
          type: Error,
          text1: 'Error',
          text2: `An error occurred while uploading ${file.fileName}.`,
        })
        return
      }
      Toast.show({ text1: `Successfully uploaded ${fileObject.name}` })

      return fileObject
    } catch (error) {
      await handleUploadError()
    }
  }

  const handleFileAction = useCallback(
    async (action: UploadedFileItemAction) => {
      const file = action.payload
      let isAuthorizedForAction = true

      if (file.protected && action.type !== UploadedFileItemActionType.ToggleFileProtection) {
        isAuthorizedForAction = await authorizeProtectedActionForFile(file, ChallengeReason.AccessProtectedFile)
      }

      if (!isAuthorizedForAction) {
        return false
      }

      switch (action.type) {
        case UploadedFileItemActionType.AttachFileToNote:
          await attachFileToNote(file)
          break
        case UploadedFileItemActionType.DetachFileToNote:
          await detachFileFromNote(file)
          break
        case UploadedFileItemActionType.ShareFile:
          await shareFile(file)
          break
        case UploadedFileItemActionType.DownloadFile:
          await downloadFileAndReturnLocalPath({ file })
          break
        case UploadedFileItemActionType.ToggleFileProtection: {
          await toggleFileProtection(file)
          break
        }
        case UploadedFileItemActionType.RenameFile:
          navigation.navigate(SCREEN_INPUT_MODAL_FILE_NAME, {
            file,
            renameFile,
          })
          break
        case UploadedFileItemActionType.PreviewFile:
          await previewFile(file)
          break
        case UploadedFileItemActionType.DeleteFile:
          await deleteFile(file)
          break
        default:
          break
      }

      await application.sync.sync()
      return true
    },
    [
      application.sync,
      attachFileToNote,
      authorizeProtectedActionForFile,
      deleteFile,
      detachFileFromNote,
      downloadFileAndReturnLocalPath,
      navigation,
      previewFile,
      renameFile,
      shareFile,
      toggleFileProtection,
    ],
  )

  useEffect(() => {
    const unregisterFileStream = application.streamItems(ContentType.File, () => {
      reloadAttachedFiles()
      reloadAllFiles()
    })

    return () => {
      unregisterFileStream()
    }
  }, [application, reloadAllFiles, reloadAttachedFiles])

  const showActionsMenu = useCallback(
    (file: FileItem | undefined) => {
      if (!file) {
        return
      }
      const isAttachedToNote = attachedFiles.includes(file)

      const actions: CustomActionSheetOption[] = [
        {
          text: 'Preview',
          callback: async () => {
            await handleFileAction({
              type: UploadedFileItemActionType.PreviewFile,
              payload: file,
            })
          },
        },
        {
          text: isAttachedToNote ? 'Detach from note' : 'Attach to note',
          callback: isAttachedToNote
            ? async () => {
                await handleFileAction({
                  type: UploadedFileItemActionType.DetachFileToNote,
                  payload: file,
                })
              }
            : async () => {
                await handleFileAction({
                  type: UploadedFileItemActionType.AttachFileToNote,
                  payload: file,
                })
              },
        },
        {
          text: `${file.protected ? 'Disable' : 'Enable'} password protection`,
          callback: async () => {
            await handleFileAction({
              type: UploadedFileItemActionType.ToggleFileProtection,
              payload: file,
            })
          },
        },
        {
          text: Platform.OS === 'ios' ? 'Export' : 'Share',
          callback: async () => {
            await handleFileAction({
              type: UploadedFileItemActionType.ShareFile,
              payload: file,
            })
          },
        },
        {
          text: 'Download',
          callback: async () => {
            await handleFileAction({
              type: UploadedFileItemActionType.DownloadFile,
              payload: file,
            })
          },
        },
        {
          text: 'Rename',
          callback: async () => {
            await handleFileAction({
              type: UploadedFileItemActionType.RenameFile,
              payload: file,
            })
          },
        },
        {
          text: 'Delete permanently',
          callback: async () => {
            await handleFileAction({
              type: UploadedFileItemActionType.DeleteFile,
              payload: file,
            })
          },
          destructive: true,
        },
      ]
      const osDependentActions =
        Platform.OS === 'ios' ? actions.filter(action => action.text !== 'Download') : [...actions]
      showActionSheet({
        title: file.name,
        options: osDependentActions,
        styles: {
          titleTextStyle: {
            fontWeight: 'bold',
          },
        },
      })
    },
    [attachedFiles, handleFileAction, showActionSheet],
  )

  return {
    showActionsMenu,
    attachedFiles,
    allFiles,
    handleFileAction,
    handlePressAttachFile,
    uploadFileFromCameraOrImageGallery,
    attachFileToNote,
  }
}

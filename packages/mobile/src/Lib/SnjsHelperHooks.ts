import { ApplicationContext } from '@Root/ApplicationContext'
import { useSafeApplicationContext } from '@Root/Hooks/useSafeApplicationContext'
import { SCREEN_NOTES } from '@Root/Screens/screens'
import {
  ApplicationEvent,
  ButtonType,
  isSameDay,
  NoteMutator,
  NoteViewController,
  SNNote,
  StorageEncryptionPolicy,
} from '@standardnotes/snjs'
import React, { useCallback, useEffect } from 'react'
import { LockStateType } from './ApplicationState'

export const useSignedIn = (signedInCallback?: () => void, signedOutCallback?: () => void) => {
  // Context
  const application = useSafeApplicationContext()

  const [isLocked] = useIsLocked()

  // State
  const [signedIn, setSignedIn] = React.useState(false)

  React.useEffect(() => {
    let mounted = true
    const getSignedIn = async () => {
      if (mounted && !isLocked) {
        setSignedIn(!application.noAccount())
      }
    }
    void getSignedIn()
    const removeSignedInObserver = application.addEventObserver(async event => {
      if (event === ApplicationEvent.Launched) {
        void getSignedIn()
      }
      if (event === ApplicationEvent.SignedIn) {
        setSignedIn(true)
        signedInCallback && signedInCallback()
      } else if (event === ApplicationEvent.SignedOut) {
        setSignedIn(false)
        signedOutCallback && signedOutCallback()
      }
    })

    return () => {
      mounted = false
      removeSignedInObserver && removeSignedInObserver()
    }
  }, [application, signedInCallback, signedOutCallback, isLocked])

  return [signedIn]
}

export const useOutOfSync = () => {
  // Context
  const application = useSafeApplicationContext()

  // State
  const [outOfSync, setOutOfSync] = React.useState<boolean>(false)

  React.useEffect(() => {
    let isMounted = true
    const getOutOfSync = async () => {
      const outOfSyncInitial = await application.sync.isOutOfSync()
      if (isMounted) {
        setOutOfSync(Boolean(outOfSyncInitial))
      }
    }
    void getOutOfSync()
    return () => {
      isMounted = false
    }
  }, [application])

  React.useEffect(() => {
    const removeSignedInObserver = application.addEventObserver(async event => {
      if (event === ApplicationEvent.EnteredOutOfSync) {
        setOutOfSync(true)
      } else if (event === ApplicationEvent.ExitedOutOfSync) {
        setOutOfSync(false)
      }
    })

    return removeSignedInObserver
  }, [application])

  return [outOfSync]
}

export const useIsLocked = () => {
  // Context
  const application = React.useContext(ApplicationContext)

  // State
  const [isLocked, setIsLocked] = React.useState<boolean>(() => {
    if (!application || !application.getAppState()) {
      return true
    }

    return Boolean(application?.getAppState().locked)
  })

  useEffect(() => {
    let isMounted = true
    const removeSignedInObserver = application?.getAppState().addLockStateChangeObserver(event => {
      if (isMounted) {
        if (event === LockStateType.Locked) {
          setIsLocked(true)
        }
        if (event === LockStateType.Unlocked) {
          setIsLocked(false)
        }
      }
    })

    return () => {
      isMounted = false
      removeSignedInObserver && removeSignedInObserver()
    }
  }, [application])

  return [isLocked]
}

export const useHasEditor = () => {
  // Context
  const application = React.useContext(ApplicationContext)

  // State
  const [hasEditor, setHasEditor] = React.useState<boolean>(false)

  useEffect(() => {
    const removeEditorObserver = application?.editorGroup.addActiveControllerChangeObserver(newEditor => {
      setHasEditor(Boolean(newEditor))
    })
    return removeEditorObserver
  }, [application])

  return [hasEditor]
}

export const useSyncStatus = () => {
  // Context
  const application = React.useContext(ApplicationContext)

  // State
  const [completedInitialSync, setCompletedInitialSync] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [decrypting, setDecrypting] = React.useState(false)
  const [refreshing, setRefreshing] = React.useState(false)

  const setStatus = useCallback(
    (status = '') => {
      application?.getStatusManager().setMessage(SCREEN_NOTES, status)
    },
    [application],
  )

  const updateLocalDataStatus = useCallback(() => {
    const syncStatus = application!.sync.getSyncStatus()
    const stats = syncStatus.getStats()
    const encryption =
      application!.isEncryptionAvailable() &&
      application!.getStorageEncryptionPolicy() === StorageEncryptionPolicy.Default

    if (stats.localDataCurrent === 0 || stats.localDataTotal === 0 || stats.localDataDone) {
      setStatus()
      return
    }
    const notesString = `${stats.localDataCurrent}/${stats.localDataTotal} items…`
    const loadingStatus = encryption ? `Decrypting ${notesString}` : `Loading ${notesString}`
    setStatus(loadingStatus)
  }, [application, setStatus])

  useEffect(() => {
    let mounted = true
    const isEncryptionAvailable =
      application!.isEncryptionAvailable() &&
      application!.getStorageEncryptionPolicy() === StorageEncryptionPolicy.Default
    if (mounted) {
      setDecrypting(!completedInitialSync && isEncryptionAvailable)
      updateLocalDataStatus()
      setLoading(!completedInitialSync && !isEncryptionAvailable)
    }
    return () => {
      mounted = false
    }
  }, [application, completedInitialSync, updateLocalDataStatus])

  const updateSyncStatus = useCallback(() => {
    const syncStatus = application!.sync.getSyncStatus()
    const stats = syncStatus.getStats()
    if (syncStatus.hasError()) {
      setRefreshing(false)
      setStatus('Unable to Sync')
    } else if (stats.downloadCount > 20) {
      const text = `Downloading ${stats.downloadCount} items. Keep app open.`
      setStatus(text)
    } else if (stats.uploadTotalCount > 20) {
      setStatus(`Syncing ${stats.uploadCompletionCount}/${stats.uploadTotalCount} items...`)
    } else if (syncStatus.syncInProgress && !completedInitialSync) {
      setStatus('Syncing…')
    } else {
      setStatus()
    }
  }, [application, completedInitialSync, setStatus])

  useEffect(() => {
    const unsubscribeAppEvents = application?.addEventObserver(async eventName => {
      if (eventName === ApplicationEvent.LocalDataIncrementalLoad) {
        updateLocalDataStatus()
      } else if (eventName === ApplicationEvent.SyncStatusChanged || eventName === ApplicationEvent.FailedSync) {
        updateSyncStatus()
      } else if (eventName === ApplicationEvent.LocalDataLoaded) {
        setDecrypting(false)
        setLoading(false)
        updateLocalDataStatus()
      } else if (eventName === ApplicationEvent.CompletedFullSync) {
        if (completedInitialSync) {
          setRefreshing(false)
        } else {
          setCompletedInitialSync(true)
        }
        setLoading(false)
        updateSyncStatus()
      } else if (eventName === ApplicationEvent.LocalDatabaseReadError) {
        void application!.alertService!.alert('Unable to load local storage. Please restart the app and try again.')
      } else if (eventName === ApplicationEvent.LocalDatabaseWriteError) {
        void application!.alertService!.alert('Unable to write to local storage. Please restart the app and try again.')
      } else if (eventName === ApplicationEvent.SignedIn) {
        setLoading(true)
      }
    })

    return unsubscribeAppEvents
  }, [application, completedInitialSync, setStatus, updateLocalDataStatus, updateSyncStatus])

  const startRefreshing = () => {
    setRefreshing(true)
  }

  return [loading, decrypting, refreshing, startRefreshing] as [boolean, boolean, boolean, () => void]
}

export const useDeleteNoteWithPrivileges = (
  note: SNNote,
  onDeleteCallback: () => void,
  onTrashCallback: () => void,
  editor?: NoteViewController,
) => {
  // Context
  const application = React.useContext(ApplicationContext)

  const trashNote = useCallback(async () => {
    const title = 'Move to Trash'
    const message = 'Are you sure you want to move this note to the trash?'

    const confirmed = await application?.alertService?.confirm(message, title, 'Confirm', ButtonType.Danger)
    if (confirmed) {
      onTrashCallback()
    }
  }, [application?.alertService, onTrashCallback])

  const deleteNotePermanently = useCallback(async () => {
    const title = `Delete ${note!.title}`
    const message = 'Are you sure you want to permanently delete this note?'
    if (editor?.isTemplateNote) {
      void application?.alertService!.alert(
        'This note is a placeholder and cannot be deleted. To remove from your list, simply navigate to a different note.',
      )
      return
    }
    const confirmed = await application?.alertService?.confirm(message, title, 'Delete', ButtonType.Danger, 'Cancel')
    if (confirmed) {
      onDeleteCallback()
    }
  }, [application?.alertService, editor?.isTemplateNote, note, onDeleteCallback])

  const deleteNote = useCallback(
    async (permanently: boolean) => {
      if (note?.locked) {
        void application?.alertService.alert(
          "This note has editing disabled. If you'd like to delete it, enable editing on it, and try again.",
        )
        return
      }
      if (permanently) {
        void deleteNotePermanently()
      } else {
        void trashNote()
      }
    },
    [application, deleteNotePermanently, note?.locked, trashNote],
  )

  return [deleteNote]
}

export const useProtectionSessionExpiry = () => {
  // Context
  const application = useSafeApplicationContext()

  const getProtectionsDisabledUntil = React.useCallback(() => {
    const protectionExpiry = application?.getProtectionSessionExpiryDate()
    const now = new Date()

    if (protectionExpiry && protectionExpiry > now) {
      if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
        let f: Intl.DateTimeFormat

        if (isSameDay(protectionExpiry, now)) {
          f = new Intl.DateTimeFormat(undefined, {
            hour: 'numeric',
            minute: 'numeric',
          })
        } else {
          f = new Intl.DateTimeFormat(undefined, {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
            hour: 'numeric',
            minute: 'numeric',
          })
        }

        return f.format(protectionExpiry)
      } else {
        if (isSameDay(protectionExpiry, now)) {
          return protectionExpiry.toLocaleTimeString()
        } else {
          return `${protectionExpiry.toDateString()} ${protectionExpiry.toLocaleTimeString()}`
        }
      }
    }
    return null
  }, [application])

  // State
  const [protectionsDisabledUntil, setProtectionsDisabledUntil] = React.useState(getProtectionsDisabledUntil())

  useEffect(() => {
    const removeProtectionLengthSubscriber = application?.addEventObserver(async event => {
      if ([ApplicationEvent.UnprotectedSessionBegan, ApplicationEvent.UnprotectedSessionExpired].includes(event)) {
        setProtectionsDisabledUntil(getProtectionsDisabledUntil())
      }
    })
    return () => {
      removeProtectionLengthSubscriber && removeProtectionLengthSubscriber()
    }
  }, [application, getProtectionsDisabledUntil])

  return [protectionsDisabledUntil]
}

export const useChangeNoteChecks = (note: SNNote | undefined, editor: NoteViewController | undefined = undefined) => {
  // Context
  const application = useSafeApplicationContext()

  const canChangeNote = useCallback(async () => {
    if (!note) {
      return false
    }

    if (editor && editor.isTemplateNote) {
      await editor.insertTemplatedNote()
    }

    if (!application.items.findItem(note.uuid)) {
      void application.alertService!.alert(
        "The note you are attempting to save can not be found or has been deleted. Changes you make will not be synced. Please copy this note's text and start a new note.",
      )
      return false
    }

    return true
  }, [application, editor, note])

  return [canChangeNote]
}

export const useChangeNote = (note: SNNote | undefined, editor: NoteViewController | undefined = undefined) => {
  const application = React.useContext(ApplicationContext)

  const [canChangeNote] = useChangeNoteChecks(note, editor)

  const changeNote = useCallback(
    async (mutate: (mutator: NoteMutator) => void, updateTimestamps: boolean) => {
      if (await canChangeNote()) {
        await application?.mutator.changeAndSaveItem(
          note!,
          mutator => {
            const noteMutator = mutator as NoteMutator
            mutate(noteMutator)
          },
          updateTimestamps,
        )
      }
    },
    [application, note, canChangeNote],
  )

  return [changeNote]
}

export const useProtectOrUnprotectNote = (
  note: SNNote | undefined,
  editor: NoteViewController | undefined = undefined,
) => {
  // Context
  const application = React.useContext(ApplicationContext)

  const [canChangeNote] = useChangeNoteChecks(note, editor)

  const protectOrUnprotectNote = useCallback(async () => {
    if (await canChangeNote()) {
      if (note!.protected) {
        await application?.mutator.unprotectNote(note!)
      } else {
        await application?.mutator.protectNote(note!)
      }
    }
  }, [application, note, canChangeNote])

  return [protectOrUnprotectNote]
}

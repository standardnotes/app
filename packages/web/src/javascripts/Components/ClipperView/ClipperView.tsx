import { WebApplicationGroup } from '@/Application/WebApplicationGroup'
import { useCallback, useEffect, useState } from 'react'
import { AccountMenuPane } from '../AccountMenu/AccountMenuPane'
import MenuPaneSelector from '../AccountMenu/MenuPaneSelector'
import { useApplication } from '../ApplicationProvider'
import Icon from '../Icon/Icon'
import Menu from '../Menu/Menu'
import MenuItem from '../Menu/MenuItem'
import { storage as extensionStorage, runtime, windows } from 'webextension-polyfill'
import sendMessageToActiveTab from '@standardnotes/clipper/src/utils/sendMessageToActiveTab'
import { ClipPayload, RuntimeMessageTypes } from '@standardnotes/clipper/src/types/message'
import { confirmDialog } from '@standardnotes/ui-services'
import {
  ApplicationEvent,
  ContentType,
  DecryptedItem,
  NativeFeatureIdentifier,
  FeatureStatus,
  NoteContent,
  NoteType,
  PrefKey,
  SNNote,
  SNTag,
  classNames,
} from '@standardnotes/snjs'
import { addToast, ToastType } from '@standardnotes/toast'
import { getSuperJSONFromClipPayload } from './getSuperJSONFromClipHTML'
import ClippedNoteView from './ClippedNoteView'
import { PremiumFeatureIconClass, PremiumFeatureIconName } from '../Icon/PremiumFeatureIcon'
import Button from '../Button/Button'

import { useStateRef } from '@/Hooks/useStateRef'
import usePreference from '@/Hooks/usePreference'
import { createLinkFromItem } from '@/Utils/Items/Search/createLinkFromItem'
import ItemSelectionDropdown from '../ItemSelectionDropdown/ItemSelectionDropdown'
import LinkedItemBubble from '../LinkedItems/LinkedItemBubble'
import StyledTooltip from '../StyledTooltip/StyledTooltip'
import MenuSwitchButtonItem from '../Menu/MenuSwitchButtonItem'
import Spinner from '../Spinner/Spinner'

const ClipperView = ({ applicationGroup }: { applicationGroup: WebApplicationGroup }) => {
  const application = useApplication()

  const [currentWindow, setCurrentWindow] = useState<Awaited<ReturnType<typeof windows.getCurrent>>>()
  useEffect(() => {
    windows
      .getCurrent({
        populate: true,
      })
      .then((window) => {
        setCurrentWindow(window)
      })
      .catch(console.error)
  }, [])
  const isFirefoxPopup = !!currentWindow && currentWindow.type === 'popup' && currentWindow.incognito === false

  const [user, setUser] = useState(() => application.sessions.getUser())
  const [isSyncing, setIsSyncing] = useState(false)
  const [hasSyncError, setHasSyncError] = useState(false)
  useEffect(() => {
    application.sessions.refreshSessionIfExpiringSoon().catch(console.error)
  }, [application.sessions])
  const [isEntitledToExtension, setIsEntitled] = useState(
    () =>
      application.features.getFeatureStatus(
        NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.Clipper).getValue(),
      ) === FeatureStatus.Entitled,
  )
  const isEntitledRef = useStateRef(isEntitledToExtension)
  const hasSubscription = application.hasValidFirstPartySubscription()
  useEffect(() => {
    return application.addEventObserver(async (event) => {
      switch (event) {
        case ApplicationEvent.SignedIn:
        case ApplicationEvent.SignedOut:
        case ApplicationEvent.UserRolesChanged:
          setUser(application.sessions.getUser())
          setIsEntitled(
            application.features.getFeatureStatus(
              NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.Clipper).getValue(),
            ) === FeatureStatus.Entitled,
          )
          break
        case ApplicationEvent.FeaturesAvailabilityChanged:
          setIsEntitled(
            application.features.getFeatureStatus(
              NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.Clipper).getValue(),
            ) === FeatureStatus.Entitled,
          )
          break
        case ApplicationEvent.SyncStatusChanged:
        case ApplicationEvent.FailedSync: {
          const status = application.sync.getSyncStatus()
          setIsSyncing(status.syncInProgress)
          setHasSyncError(status.hasError())
          break
        }
      }
    })
  }, [application])

  const defaultTagId = usePreference(PrefKey.ClipperDefaultTagUuid)
  const [defaultTag, setDefaultTag] = useState<SNTag | undefined>()
  const defaultTagRef = useStateRef(defaultTag)

  useEffect(() => {
    if (!defaultTagId) {
      setDefaultTag(undefined)
      return
    }

    const tag = application.items.findItem(defaultTagId) as SNTag | undefined
    setDefaultTag(tag)
  }, [defaultTagId, application])

  const selectTag = useCallback(
    (tag: DecryptedItem) => {
      void application.setPreference(PrefKey.ClipperDefaultTagUuid, tag.uuid)
    },
    [application],
  )

  const unselectTag = useCallback(async () => {
    void application.setPreference(PrefKey.ClipperDefaultTagUuid, undefined)
  }, [application])

  const [menuPane, setMenuPane] = useState<AccountMenuPane>()

  const activateRegisterPane = useCallback(() => {
    setMenuPane(AccountMenuPane.Register)
  }, [setMenuPane])

  const activateSignInPane = useCallback(() => {
    setMenuPane(AccountMenuPane.SignIn)
  }, [setMenuPane])

  const showSignOutConfirmation = useCallback(async () => {
    if (
      await confirmDialog({
        title: 'Sign Out',
        text: 'Are you sure you want to sign out?',
        confirmButtonText: 'Sign Out',
        confirmButtonStyle: 'danger',
        cancelButtonText: 'Cancel',
      })
    ) {
      await application.user.signOut()
    }
  }, [application.user])

  const [isScreenshotMode, setIsScreenshotMode] = useState(false)
  useEffect(() => {
    void sendMessageToActiveTab({
      type: RuntimeMessageTypes.ToggleScreenshotMode,
      enabled: isScreenshotMode,
    })
  }, [isScreenshotMode])

  const [hasSelection, setHasSelection] = useState(false)
  useEffect(() => {
    if (!user) {
      return
    }

    try {
      const checkIfPageHasSelection = async () => {
        setHasSelection(Boolean(await sendMessageToActiveTab({ type: RuntimeMessageTypes.HasSelection })))
      }

      void checkIfPageHasSelection()
    } catch (error) {
      console.error(error)
    }
  }, [user])

  const [clipPayload, setClipPayload] = useState<ClipPayload>()
  useEffect(() => {
    const getClipFromStorage = async () => {
      const result = await extensionStorage.local.get('clip')
      if (!result.clip) {
        return
      }
      setClipPayload(result.clip)
      void extensionStorage.local.remove('clip')
    }

    void getClipFromStorage()
  }, [])

  const clearClip = useCallback(() => {
    setClipPayload(undefined)
  }, [])

  const [clippedNote, setClippedNote] = useState<SNNote>()
  useEffect(() => {
    if (!isEntitledRef.current) {
      return
    }

    async function createNoteFromClip() {
      if (!clipPayload) {
        setClippedNote(undefined)
        return
      }
      if (!clipPayload.content) {
        addToast({
          type: ToastType.Error,
          message: 'No content to clip',
        })
        return
      }
      if (clipPayload.isScreenshot) {
        const blob = await fetch(clipPayload.content).then((response) => response.blob())

        const file = new File([blob], `${clipPayload.title} - ${clipPayload.url}.png`, {
          type: 'image/png',
        })

        const uploadedFile = await application.filesController.uploadNewFile(file).catch(console.error)

        if (uploadedFile && defaultTagRef.current) {
          await application.linkingController.linkItems(uploadedFile, defaultTagRef.current)
        }

        return
      }

      const editorStateJSON = await getSuperJSONFromClipPayload(clipPayload)

      const note = application.items.createTemplateItem<NoteContent, SNNote>(ContentType.TYPES.Note, {
        title: clipPayload.title,
        text: editorStateJSON,
        editorIdentifier: NativeFeatureIdentifier.TYPES.SuperEditor,
        noteType: NoteType.Super,
        references: [],
      })

      const insertedNote = await application.mutator.insertItem(note)

      if (defaultTagRef.current) {
        await application.linkingController.linkItems(insertedNote, defaultTagRef.current)
      }

      setClippedNote(insertedNote as SNNote)

      addToast({
        type: ToastType.Success,
        message: 'Note clipped successfully',
      })

      const syncRequest = await application.sync.getRawSyncRequestForExternalUse([insertedNote])

      if (syncRequest) {
        runtime
          .sendMessage({
            type: RuntimeMessageTypes.RunHttpRequest,
            payload: syncRequest,
          })
          .catch(console.error)
      }
    }

    createNoteFromClip().catch(console.error)
  }, [
    application.filesController,
    application.items,
    application.linkingController,
    application.mutator,
    application.sync,
    clipPayload,
    defaultTagRef,
    isEntitledRef,
  ])

  const upgradePlan = useCallback(async () => {
    if (hasSubscription) {
      await application.openSubscriptionDashboard.execute()
    } else {
      await application.openPurchaseFlow()
    }
    window.close()
  }, [application, hasSubscription])

  if (user && !isEntitledToExtension) {
    return (
      <div className="px-3 py-3">
        <div
          className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-[50%] bg-contrast"
          aria-hidden={true}
        >
          <Icon className={`h-12 w-12 ${PremiumFeatureIconClass}`} size={'custom'} type={PremiumFeatureIconName} />
        </div>
        <div className="mb-1 text-center text-lg font-bold">Enable Advanced Features</div>
        <div className="mb-3 text-center">
          To take advantage of <span className="font-semibold">Web Clipper</span> and other advanced features, upgrade
          your current plan.
        </div>
        <Button className="mb-2" fullWidth primary onClick={upgradePlan}>
          Upgrade
        </Button>
        <Button fullWidth onClick={showSignOutConfirmation}>
          Sign out
        </Button>
      </div>
    )
  }

  if (clippedNote) {
    return (
      <ClippedNoteView
        note={clippedNote}
        key={clippedNote.uuid}
        linkingController={application.linkingController}
        clearClip={clearClip}
        isFirefoxPopup={isFirefoxPopup}
      />
    )
  }

  if (!user) {
    return menuPane ? (
      <div className="py-1">
        <MenuPaneSelector
          mainApplicationGroup={applicationGroup}
          menuPane={menuPane}
          setMenuPane={setMenuPane}
          closeMenu={() => setMenuPane(undefined)}
        />
      </div>
    ) : (
      <Menu a11yLabel="User account menu">
        <MenuItem onClick={activateRegisterPane}>
          <Icon type="user" className="mr-2 h-6 w-6 text-neutral md:h-5 md:w-5" />
          Create free account
        </MenuItem>
        <MenuItem onClick={activateSignInPane}>
          <Icon type="signIn" className="mr-2 h-6 w-6 text-neutral md:h-5 md:w-5" />
          Sign in
        </MenuItem>
      </Menu>
    )
  }

  return (
    <div className="bg-contrast p-3">
      <Menu a11yLabel="Extension menu" className="rounded border border-border bg-default">
        {hasSelection && (
          <MenuItem
            className="border-b border-border"
            disabled={isScreenshotMode}
            onClick={async () => {
              const payload = await sendMessageToActiveTab({ type: RuntimeMessageTypes.GetSelection })
              if (!payload) {
                return
              }
              setClipPayload(payload)
            }}
          >
            <Icon type="paragraph" className="mr-2 text-info" />
            Clip text selection
          </MenuItem>
        )}
        <MenuItem
          onClick={async () => {
            const payload = await sendMessageToActiveTab({ type: RuntimeMessageTypes.GetFullPage })
            if (!payload) {
              return
            }
            setClipPayload(payload)
          }}
        >
          <Icon type="notes-filled" className="mr-2 text-info" />
          {isScreenshotMode ? 'Capture visible' : 'Clip full page'}
        </MenuItem>
        <MenuItem
          disabled={isScreenshotMode}
          onClick={async () => {
            const payload = await sendMessageToActiveTab({ type: RuntimeMessageTypes.GetArticle })
            if (!payload) {
              return
            }
            setClipPayload(payload)
          }}
        >
          <Icon type="rich-text" className="mr-2 text-info" />
          Clip article
        </MenuItem>
        <MenuItem
          onClick={async () => {
            void sendMessageToActiveTab({ type: RuntimeMessageTypes.StartNodeSelection })
            window.close()
          }}
        >
          <Icon type="dashboard" className="mr-2 text-info" />
          Select elements to {isScreenshotMode ? 'capture' : 'clip'}
        </MenuItem>
        <MenuSwitchButtonItem
          checked={isScreenshotMode}
          onChange={function (checked: boolean): void {
            setIsScreenshotMode(checked)
          }}
          className="flex-row-reverse gap-2"
          forceDesktopStyle={true}
        >
          Clip as screenshot
        </MenuSwitchButtonItem>
        <div className="border-t border-border px-3 py-3  text-foreground">
          {defaultTag && (
            <div className="flex items-center justify-between text-base">
              <LinkedItemBubble
                className="m-1 mr-2 min-w-0"
                link={createLinkFromItem(defaultTag, 'linked')}
                unlinkItem={unselectTag}
                isBidirectional={false}
              />
              <StyledTooltip label="Remove default tag" gutter={2}>
                <button
                  className="rounded-full p-1 text-neutral hover:bg-contrast hover:text-info"
                  onClick={unselectTag}
                >
                  <Icon type="clear-circle-filled" />
                </button>
              </StyledTooltip>
            </div>
          )}
          <ItemSelectionDropdown
            onSelection={selectTag}
            placeholder="Select tag to save clipped notes to..."
            contentTypes={[ContentType.TYPES.Tag]}
            className={{
              input: 'text-[0.85rem]',
            }}
            comboboxProps={{
              placement: 'top',
            }}
          />
        </div>
        <div className="flex items-center border-t border-border text-foreground">
          <Icon type="user" className="mx-2" />
          <div className="flex-grow py-2 text-sm font-semibold">{user.email}</div>
          <button
            className="flex-shrink-0 border-l border-border px-2 py-2 hover:bg-info-backdrop focus:bg-info-backdrop focus:shadow-none focus:outline-none"
            onClick={showSignOutConfirmation}
          >
            <Icon type="signOut" className="text-neutral" />
          </button>
        </div>
        {isSyncing || hasSyncError ? (
          <div className={classNames('flex items-center border-t border-border', hasSyncError && 'text-danger')}>
            {isSyncing && (
              <>
                <Spinner className="mx-2.5 h-4 w-4" />
                <div className="flex-grow py-2 text-sm font-semibold text-info">Syncing...</div>
              </>
            )}
            {hasSyncError && (
              <>
                <Icon type="warning" className="mx-2.5" />
                <div className="flex-grow py-2 text-sm font-semibold">Unable to sync</div>
              </>
            )}
          </div>
        ) : null}
      </Menu>
    </div>
  )
}

export default ClipperView

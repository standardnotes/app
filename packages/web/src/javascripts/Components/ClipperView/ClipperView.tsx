import { ApplicationGroup } from '@/Application/ApplicationGroup'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { SNLogoFull } from '@standardnotes/icons'
import { useCallback, useEffect, useState } from 'react'
import { AccountMenuPane } from '../AccountMenu/AccountMenuPane'
import MenuPaneSelector from '../AccountMenu/MenuPaneSelector'
import { useApplication } from '../ApplicationProvider'
import Icon from '../Icon/Icon'
import Menu from '../Menu/Menu'
import MenuItem from '../Menu/MenuItem'
import { storage as extensionStorage, windows } from 'webextension-polyfill'
import sendMessageToActiveTab from '@standardnotes/clipper/src/utils/sendMessageToActiveTab'
import { ClipPayload, RuntimeMessageTypes } from '@standardnotes/clipper/src/types/message'
import { confirmDialog } from '@standardnotes/ui-services'
import {
  ApplicationEvent,
  ContentType,
  FeatureIdentifier,
  FeatureStatus,
  NoteContent,
  NoteType,
  SNNote,
} from '@standardnotes/snjs'
import { addToast, ToastType } from '@standardnotes/toast'
import { getSuperJSONFromClipPayload } from './getSuperJSONFromClipHTML'
import ClippedNoteView from './ClippedNoteView'
import { PremiumFeatureIconClass, PremiumFeatureIconName } from '../Icon/PremiumFeatureIcon'
import Button from '../Button/Button'
import { openSubscriptionDashboard } from '@/Utils/ManageSubscription'
import { useStateRef } from '@/Hooks/useStateRef'

const Header = () => (
  <div className="flex items-center border-b border-border p-1 px-3 py-2 text-base font-semibold text-info-contrast">
    <SNLogoFull className="h-7" />
  </div>
)

const ClipperView = ({
  viewControllerManager,
  applicationGroup,
}: {
  viewControllerManager: ViewControllerManager
  applicationGroup: ApplicationGroup
}) => {
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

  const [user, setUser] = useState(() => application.getUser())
  const [isEntitledToExtension, setIsEntitled] = useState(
    () => application.features.getFeatureStatus(FeatureIdentifier.Extension) === FeatureStatus.Entitled,
  )
  const isEntitledRef = useStateRef(isEntitledToExtension)
  const hasSubscription = application.hasValidSubscription()
  useEffect(() => {
    return application.addEventObserver(async (event) => {
      switch (event) {
        case ApplicationEvent.SignedIn:
        case ApplicationEvent.SignedOut:
        case ApplicationEvent.UserRolesChanged:
          setUser(application.getUser())
          setIsEntitled(application.features.getFeatureStatus(FeatureIdentifier.Extension) === FeatureStatus.Entitled)
          break
        case ApplicationEvent.FeaturesUpdated:
          setIsEntitled(application.features.getFeatureStatus(FeatureIdentifier.Extension) === FeatureStatus.Entitled)
          break
      }
    })
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

  const [hasSelection, setHasSelection] = useState(false)
  useEffect(() => {
    if (!user) {
      return
    }

    try {
      const checkIfPageHasSelection = async () => {
        setHasSelection(Boolean(await sendMessageToActiveTab(RuntimeMessageTypes.HasSelection)))
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

      const editorStateJSON = await getSuperJSONFromClipPayload(clipPayload)

      const note = application.items.createTemplateItem<NoteContent, SNNote>(ContentType.Note, {
        title: clipPayload.title,
        text: editorStateJSON,
        editorIdentifier: FeatureIdentifier.SuperEditor,
        noteType: NoteType.Super,
        references: [],
      })

      void application.items.insertItem(note).then((note) => {
        setClippedNote(note as SNNote)
        addToast({
          type: ToastType.Success,
          message: 'Note clipped successfully',
        })
      })
    }

    void createNoteFromClip()
  }, [application.items, clipPayload, isEntitledRef])

  const upgradePlan = useCallback(async () => {
    if (hasSubscription) {
      await openSubscriptionDashboard(application)
    } else {
      await application.openPurchaseFlow()
    }
    window.close()
  }, [application, hasSubscription])

  if (user && !isEntitledToExtension) {
    return (
      <>
        <Header />
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
      </>
    )
  }

  if (clippedNote) {
    return (
      <>
        <Header />
        <ClippedNoteView
          note={clippedNote}
          key={clippedNote.uuid}
          linkingController={viewControllerManager.linkingController}
          clearClip={clearClip}
          isFirefoxPopup={isFirefoxPopup}
        />
      </>
    )
  }

  if (!user) {
    return (
      <>
        <Header />
        {menuPane ? (
          <div className="py-1">
            <MenuPaneSelector
              viewControllerManager={viewControllerManager}
              application={application}
              mainApplicationGroup={applicationGroup}
              menuPane={menuPane}
              setMenuPane={setMenuPane}
              closeMenu={() => setMenuPane(undefined)}
            />
          </div>
        ) : (
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
      </>
    )
  }

  return (
    <>
      <Header />
      <div>
        <Menu a11yLabel="Extension menu" isOpen={true} className="pb-1">
          <MenuItem
            onClick={async () => {
              const payload = await sendMessageToActiveTab(RuntimeMessageTypes.GetFullPage)
              if (!payload) {
                return
              }
              setClipPayload(payload)
            }}
          >
            Clip full page
          </MenuItem>
          <MenuItem
            onClick={async () => {
              const payload = await sendMessageToActiveTab(RuntimeMessageTypes.GetArticle)
              if (!payload) {
                return
              }
              setClipPayload(payload)
            }}
          >
            Clip article
          </MenuItem>
          <MenuItem
            disabled={!hasSelection}
            onClick={async () => {
              const payload = await sendMessageToActiveTab(RuntimeMessageTypes.GetSelection)
              if (!payload) {
                return
              }
              setClipPayload(payload)
            }}
          >
            Clip current selection
          </MenuItem>
          <MenuItem
            onClick={async () => {
              void sendMessageToActiveTab(RuntimeMessageTypes.StartNodeSelection)
              window.close()
            }}
          >
            Select elements to clip
          </MenuItem>
          <div className="border-t border-border px-3 pt-3 pb-1 text-base text-foreground">
            <div>You're signed in as:</div>
            <div className="wrap my-0.5 font-bold">{user.email}</div>
            <span className="text-neutral">{application.getHost()}</span>
          </div>
          <MenuItem onClick={showSignOutConfirmation}>
            <Icon type="signOut" className="mr-2 h-6 w-6 text-neutral" />
            Sign out
          </MenuItem>
        </Menu>
      </div>
    </>
  )
}

export default ClipperView

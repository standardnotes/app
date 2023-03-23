import { ApplicationGroup } from '@/Application/ApplicationGroup'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { SNLogoIcon } from '@standardnotes/icons'
import { useCallback, useEffect, useState } from 'react'
import { AccountMenuPane } from '../AccountMenu/AccountMenuPane'
import MenuPaneSelector from '../AccountMenu/MenuPaneSelector'
import { useApplication } from '../ApplicationProvider'
import Icon from '../Icon/Icon'
import Menu from '../Menu/Menu'
import MenuItem from '../Menu/MenuItem'
import { runtime } from 'webextension-polyfill'
import sendMessageToActiveTab from '@standardnotes/extension/src/utils/sendMessageToActiveTab'
import { ClipPayload, RuntimeMessage, RuntimeMessageTypes } from '@standardnotes/extension/src/types/message'
import { RouteParserInterface } from '@standardnotes/ui-services'
import Spinner from '../Spinner/Spinner'
import { ApplicationEvent, ContentType, FeatureIdentifier, NoteContent, NoteType, SNNote } from '@standardnotes/snjs'
import { addToast, ToastType } from '@standardnotes/toast'
import { getSuperJSONFromClipHTML } from './getSuperJSONFromClipHTML'
import ClippedNoteView from './ClippedNoteView'

const ExtensionView = ({
  viewControllerManager,
  applicationGroup,
  routeInfo,
}: {
  viewControllerManager: ViewControllerManager
  applicationGroup: ApplicationGroup
  routeInfo: RouteParserInterface
}) => {
  const application = useApplication()

  const [user, setUser] = useState(() => application.getUser())
  useEffect(() => {
    application.addEventObserver(async (event) => {
      switch (event) {
        case ApplicationEvent.SignedIn:
        case ApplicationEvent.SignedOut:
        case ApplicationEvent.UserRolesChanged:
          setUser(application.getUser())
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

  const [isSigningOut, setIsSigningOut] = useState(false)

  const showSignOutConfirmation = useCallback(() => {
    setIsSigningOut(true)
  }, [setIsSigningOut])

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
    runtime.onMessage.addListener((message: RuntimeMessage) => {
      if (message.type === RuntimeMessageTypes.ClipSelection) {
        setClipPayload(message.payload)
      }
    })
  }, [])

  const clearClip = useCallback(() => {
    setClipPayload(undefined)
  }, [])

  const [clippedNote, setClippedNote] = useState<SNNote>()
  useEffect(() => {
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

      const editorStateJSON = await getSuperJSONFromClipHTML(clipPayload.content)

      const note = application.items.createTemplateItem<NoteContent, SNNote>(ContentType.Note, {
        title: clipPayload.title,
        text: editorStateJSON,
        editorIdentifier: FeatureIdentifier.SuperEditor,
        noteType: NoteType.Super,
        references: [],
      })

      void application.items.insertItem(note).then((note) => {
        setClippedNote(note as SNNote)
      })
    }

    void createNoteFromClip()
  }, [application.items, clipPayload])

  const isLoadingClip = routeInfo.extensionViewParams.hasClip

  if (isLoadingClip && !clipPayload) {
    return (
      <>
        <div className="flex items-center bg-info p-1 px-3 py-2 text-base font-semibold text-info-contrast">
          <SNLogoIcon className="mr-2 h-6 w-6 fill-info-contrast stroke-info-contrast [fill-rule:evenodd]" />
          Standard Notes
        </div>
        <div className="flex items-center justify-center px-3 py-3">
          <Spinner className="h-8 w-7" />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="flex items-center bg-info p-1 px-3 py-2 text-base font-semibold text-info-contrast">
        <SNLogoIcon className="mr-2 h-6 w-6 fill-info-contrast stroke-info-contrast [fill-rule:evenodd]" />
        Standard Notes
      </div>
      {!user && !menuPane && !clipPayload && (
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
      {!user && !!menuPane && (
        <MenuPaneSelector
          viewControllerManager={viewControllerManager}
          application={application}
          mainApplicationGroup={applicationGroup}
          menuPane={menuPane}
          setMenuPane={setMenuPane}
          closeMenu={() => setMenuPane(undefined)}
        />
      )}
      {user && !isSigningOut && !clipPayload && (
        <div>
          <Menu a11yLabel="Extension menu" isOpen={true}>
            <div className="px-3 py-2 text-base font-semibold">Web Clipper</div>
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
              Select nodes to clip
            </MenuItem>
            <div className="border-t border-border px-3 pt-2 pb-1 text-base font-semibold">Account</div>
            <div className="px-3 pb-1 text-sm text-foreground">
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
      )}
      {isSigningOut && !clipPayload && (
        <Menu a11yLabel="Sign out confirmation" isOpen={true}>
          <div className="px-3 pt-2 pb-1 text-base font-semibold">Sign out</div>
          <div className="px-3 pb-2 text-sm text-foreground">
            <div>Are you sure you want to sign out?</div>
          </div>
          <MenuItem onClick={() => setIsSigningOut(false)}>Cancel</MenuItem>
          <MenuItem onClick={() => application.user.signOut()} className="!text-danger">
            Sign out
          </MenuItem>
        </Menu>
      )}
      {!!clippedNote && (
        <ClippedNoteView
          note={clippedNote}
          key={clippedNote.uuid}
          linkingController={viewControllerManager.linkingController}
          clearClip={clearClip}
        />
      )}
    </>
  )
}

export default ExtensionView

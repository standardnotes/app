import { ApplicationGroup } from '@/UIModels/ApplicationGroup'
import { getPlatformString, getWindowUrlParams } from '@/Utils'
import { AppStateEvent, PanelResizedData } from '@/UIModels/AppState'
import { ApplicationEvent, Challenge, removeFromArray } from '@standardnotes/snjs'
import { PANEL_NAME_NOTES, PANEL_NAME_NAVIGATION } from '@/Constants'
import { alertDialog } from '@/Services/AlertService'
import { WebApplication } from '@/UIModels/Application'
import { Navigation } from '@/Components/Navigation/Navigation'
import { NoteGroupView } from '@/Components/NoteGroupView/NoteGroupView'
import { Footer } from '@/Components/Footer/Footer'
import { SessionsModal } from '@/Components/SessionsModal/SessionsModal'
import { PreferencesViewWrapper } from '@/Components/Preferences/PreferencesViewWrapper'
import { ChallengeModal } from '@/Components/ChallengeModal/ChallengeModal'
import { NotesContextMenu } from '@/Components/NotesContextMenu/NotesContextMenu'
import { PurchaseFlowWrapper } from '@/Components/PurchaseFlow/PurchaseFlowWrapper'
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react'
import { RevisionHistoryModalWrapper } from '@/Components/RevisionHistoryModal/RevisionHistoryModalWrapper'
import { PremiumModalProvider } from '@/Hooks/usePremiumModal'
import { ConfirmSignoutContainer } from '@/Components/ConfirmSignoutModal/ConfirmSignoutModal'
import { TagsContextMenuWrapper } from '@/Components/Tags/TagContextMenu'
import { ToastContainer } from '@standardnotes/stylekit'
import { FilePreviewModalWrapper } from '@/Components/Files/FilePreviewModal'
import { isStateDealloced } from '@/UIModels/AppState/AbstractState'
import { ContentListView } from '@/Components/ContentListView/ContentListView'
import { FileContextMenu } from '@/Components/FileContextMenu/FileContextMenu'
import { PermissionsModalWrapper } from '../PermissionsModalWrapper/PermissionsModalWrapper'

type Props = {
  application: WebApplication
  mainApplicationGroup: ApplicationGroup
}

export const ApplicationView: FunctionComponent<Props> = ({ application, mainApplicationGroup }) => {
  const platformString = getPlatformString()
  const [appClass, setAppClass] = useState('')
  const [launched, setLaunched] = useState(false)
  const [needsUnlock, setNeedsUnlock] = useState(true)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [dealloced, setDealloced] = useState(false)

  const appState = application.getAppState()

  useEffect(() => {
    setDealloced(application.dealloced)
  }, [application.dealloced])

  useEffect(() => {
    if (dealloced) {
      return
    }

    const desktopService = application.getDesktopService()

    if (desktopService) {
      application.componentManager.setDesktopManager(desktopService)
    }

    application
      .prepareForLaunch({
        receiveChallenge: async (challenge) => {
          const challengesCopy = challenges.slice()
          challengesCopy.push(challenge)
          setChallenges(challengesCopy)
        },
      })
      .then(() => {
        void application.launch()
      })
      .catch(console.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application, dealloced])

  const removeChallenge = useCallback(
    (challenge: Challenge) => {
      const challengesCopy = challenges.slice()
      removeFromArray(challengesCopy, challenge)
      setChallenges(challengesCopy)
    },
    [challenges],
  )

  const onAppStart = useCallback(() => {
    setNeedsUnlock(application.hasPasscode())
  }, [application])

  const handleDemoSignInFromParams = useCallback(() => {
    const token = getWindowUrlParams().get('demo-token')
    if (!token || application.hasAccount()) {
      return
    }

    void application.sessions.populateSessionFromDemoShareToken(token)
  }, [application])

  const onAppLaunch = useCallback(() => {
    setLaunched(true)
    setNeedsUnlock(false)
    handleDemoSignInFromParams()
  }, [handleDemoSignInFromParams])

  useEffect(() => {
    if (application.isStarted()) {
      onAppStart()
    }

    if (application.isLaunched()) {
      onAppLaunch()
    }

    const removeAppObserver = application.addEventObserver(async (eventName) => {
      if (eventName === ApplicationEvent.Started) {
        onAppStart()
      } else if (eventName === ApplicationEvent.Launched) {
        onAppLaunch()
      } else if (eventName === ApplicationEvent.LocalDatabaseReadError) {
        alertDialog({
          text: 'Unable to load local database. Please restart the app and try again.',
        }).catch(console.error)
      } else if (eventName === ApplicationEvent.LocalDatabaseWriteError) {
        alertDialog({
          text: 'Unable to write to local database. Please restart the app and try again.',
        }).catch(console.error)
      }
    })

    return () => {
      removeAppObserver()
    }
  }, [application, onAppLaunch, onAppStart])

  useEffect(() => {
    const removeObserver = application.getAppState().addObserver(async (eventName, data) => {
      if (eventName === AppStateEvent.PanelResized) {
        const { panel, collapsed } = data as PanelResizedData
        let appClass = ''
        if (panel === PANEL_NAME_NOTES && collapsed) {
          appClass += 'collapsed-notes'
        }
        if (panel === PANEL_NAME_NAVIGATION && collapsed) {
          appClass += ' collapsed-navigation'
        }
        setAppClass(appClass)
      } else if (eventName === AppStateEvent.WindowDidFocus) {
        if (!(await application.isLocked())) {
          application.sync.sync().catch(console.error)
        }
      }
    })

    return () => {
      removeObserver()
    }
  }, [application])

  const renderAppContents = useMemo(() => {
    return !needsUnlock && launched
  }, [needsUnlock, launched])

  const renderChallenges = useCallback(() => {
    return (
      <>
        {challenges.map((challenge) => {
          return (
            <div className="sk-modal">
              <ChallengeModal
                key={`${challenge.id}${application.ephemeralIdentifier}`}
                application={application}
                appState={appState}
                mainApplicationGroup={mainApplicationGroup}
                challenge={challenge}
                onDismiss={removeChallenge}
              />
            </div>
          )
        })}
      </>
    )
  }, [appState, challenges, mainApplicationGroup, removeChallenge, application])

  if (dealloced || isStateDealloced(appState)) {
    return null
  }

  if (!renderAppContents) {
    return renderChallenges()
  }

  return (
    <PremiumModalProvider application={application} appState={appState}>
      <div className={platformString + ' main-ui-view sn-component'}>
        <div id="app" className={appClass + ' app app-column-container'}>
          <Navigation application={application} />
          <ContentListView application={application} appState={appState} />
          <NoteGroupView application={application} />
        </div>

        <>
          <Footer application={application} applicationGroup={mainApplicationGroup} />
          <SessionsModal application={application} appState={appState} />
          <PreferencesViewWrapper appState={appState} application={application} />
          <RevisionHistoryModalWrapper application={application} appState={appState} />
        </>

        {renderChallenges()}

        <>
          <NotesContextMenu application={application} appState={appState} />
          <TagsContextMenuWrapper appState={appState} />
          <FileContextMenu appState={appState} />
          <PurchaseFlowWrapper application={application} appState={appState} />
          <ConfirmSignoutContainer
            applicationGroup={mainApplicationGroup}
            appState={appState}
            application={application}
          />
          <ToastContainer />
          <FilePreviewModalWrapper application={application} appState={appState} />
          <PermissionsModalWrapper application={application} />
        </>
      </div>
    </PremiumModalProvider>
  )
}

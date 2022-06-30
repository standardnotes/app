import { ApplicationGroup } from '@/Application/ApplicationGroup'
import { getPlatformString, getWindowUrlParams } from '@/Utils'
import { ApplicationEvent, Challenge, removeFromArray } from '@standardnotes/snjs'
import { PANEL_NAME_NOTES, PANEL_NAME_NAVIGATION } from '@/Constants/Constants'
import { alertDialog } from '@/Services/AlertService'
import { WebApplication } from '@/Application/Application'
import { WebAppEvent } from '@/Application/WebAppEvent'
import Navigation from '@/Components/Navigation/Navigation'
import NoteGroupView from '@/Components/NoteGroupView/NoteGroupView'
import Footer from '@/Components/Footer/Footer'
import SessionsModal from '@/Components/SessionsModal/SessionsModal'
import PreferencesViewWrapper from '@/Components/Preferences/PreferencesViewWrapper'
import ChallengeModal from '@/Components/ChallengeModal/ChallengeModal'
import NotesContextMenu from '@/Components/NotesContextMenu/NotesContextMenu'
import PurchaseFlowWrapper from '@/Components/PurchaseFlow/PurchaseFlowWrapper'
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react'
import RevisionHistoryModal from '@/Components/RevisionHistoryModal/RevisionHistoryModal'
import PremiumModalProvider from '@/Hooks/usePremiumModal'
import ConfirmSignoutContainer from '@/Components/ConfirmSignoutModal/ConfirmSignoutModal'
import { ToastContainer } from '@standardnotes/toast'
import FilePreviewModalWrapper from '@/Components/FilePreview/FilePreviewModal'
import ContentListView from '@/Components/ContentListView/ContentListView'
import FileContextMenuWrapper from '@/Components/FileContextMenu/FileContextMenu'
import PermissionsModalWrapper from '@/Components/PermissionsModal/PermissionsModalWrapper'
import { PanelResizedData } from '@/Types/PanelResizedData'
import TagContextMenuWrapper from '@/Components/Tags/TagContextMenuWrapper'

type Props = {
  application: WebApplication
  mainApplicationGroup: ApplicationGroup
}

const ApplicationView: FunctionComponent<Props> = ({ application, mainApplicationGroup }) => {
  const platformString = getPlatformString()
  const [appClass, setAppClass] = useState('')
  const [launched, setLaunched] = useState(false)
  const [needsUnlock, setNeedsUnlock] = useState(true)
  const [challenges, setChallenges] = useState<Challenge[]>([])

  const viewControllerManager = application.getViewControllerManager()

  useEffect(() => {
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
  }, [application])

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
    const removeObserver = application.addWebEventObserver(async (eventName, data) => {
      if (eventName === WebAppEvent.PanelResized) {
        const { panel, collapsed } = data as PanelResizedData
        let appClass = ''
        if (panel === PANEL_NAME_NOTES && collapsed) {
          appClass += 'collapsed-notes'
        }
        if (panel === PANEL_NAME_NAVIGATION && collapsed) {
          appClass += ' collapsed-navigation'
        }
        setAppClass(appClass)
      } else if (eventName === WebAppEvent.WindowDidFocus) {
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
            <div className="sk-modal" key={`${challenge.id}${application.ephemeralIdentifier}`}>
              <ChallengeModal
                key={`${challenge.id}${application.ephemeralIdentifier}`}
                application={application}
                viewControllerManager={viewControllerManager}
                mainApplicationGroup={mainApplicationGroup}
                challenge={challenge}
                onDismiss={removeChallenge}
              />
            </div>
          )
        })}
      </>
    )
  }, [viewControllerManager, challenges, mainApplicationGroup, removeChallenge, application])

  if (!renderAppContents) {
    return renderChallenges()
  }

  return (
    <PremiumModalProvider application={application} viewControllerManager={viewControllerManager}>
      <div className={platformString + ' main-ui-view sn-component'}>
        <div id="app" className={appClass + ' app app-column-container'}>
          <Navigation application={application} />
          <ContentListView
            application={application}
            accountMenuController={viewControllerManager.accountMenuController}
            filesController={viewControllerManager.filesController}
            itemListController={viewControllerManager.itemListController}
            navigationController={viewControllerManager.navigationController}
            noAccountWarningController={viewControllerManager.noAccountWarningController}
            noteTagsController={viewControllerManager.noteTagsController}
            notesController={viewControllerManager.notesController}
            selectionController={viewControllerManager.selectionController}
          />
          <NoteGroupView application={application} />
        </div>

        <>
          <Footer application={application} applicationGroup={mainApplicationGroup} />
          <SessionsModal application={application} viewControllerManager={viewControllerManager} />
          <PreferencesViewWrapper viewControllerManager={viewControllerManager} application={application} />
          <RevisionHistoryModal
            application={application}
            historyModalController={viewControllerManager.historyModalController}
            notesController={viewControllerManager.notesController}
            selectionController={viewControllerManager.selectionController}
            subscriptionController={viewControllerManager.subscriptionController}
          />
        </>

        {renderChallenges()}

        <>
          <NotesContextMenu
            application={application}
            navigationController={viewControllerManager.navigationController}
            notesController={viewControllerManager.notesController}
            noteTagsController={viewControllerManager.noteTagsController}
            historyModalController={viewControllerManager.historyModalController}
          />
          <TagContextMenuWrapper
            navigationController={viewControllerManager.navigationController}
            featuresController={viewControllerManager.featuresController}
          />
          <FileContextMenuWrapper
            filesController={viewControllerManager.filesController}
            selectionController={viewControllerManager.selectionController}
          />
          <PurchaseFlowWrapper application={application} viewControllerManager={viewControllerManager} />
          <ConfirmSignoutContainer
            applicationGroup={mainApplicationGroup}
            viewControllerManager={viewControllerManager}
            application={application}
          />
          <ToastContainer />
          <FilePreviewModalWrapper application={application} viewControllerManager={viewControllerManager} />
          <PermissionsModalWrapper application={application} />
        </>
      </div>
    </PremiumModalProvider>
  )
}

export default ApplicationView

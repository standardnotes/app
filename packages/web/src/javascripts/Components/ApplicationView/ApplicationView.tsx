import { ApplicationGroup } from '@/Application/ApplicationGroup'
import { getPlatformString } from '@/Utils'
import { ApplicationEvent, Challenge, removeFromArray, WebAppEvent } from '@standardnotes/snjs'
import { PANEL_NAME_NOTES, PANEL_NAME_NAVIGATION } from '@/Constants/Constants'
import { alertDialog, RouteType } from '@standardnotes/ui-services'
import { WebApplication } from '@/Application/Application'
import Navigation from '@/Components/Tags/Navigation'
import NoteGroupView from '@/Components/NoteGroupView/NoteGroupView'
import Footer from '@/Components/Footer/Footer'
import SessionsModal from '@/Components/SessionsModal/SessionsModal'
import PreferencesViewWrapper from '@/Components/Preferences/PreferencesViewWrapper'
import ChallengeModal from '@/Components/ChallengeModal/ChallengeModal'
import NotesContextMenu from '@/Components/NotesContextMenu/NotesContextMenu'
import PurchaseFlowWrapper from '@/Components/PurchaseFlow/PurchaseFlowWrapper'
import { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import FileDragNDropProvider from '../FileDragNDropProvider/FileDragNDropProvider'
import ResponsivePaneProvider from '../ResponsivePane/ResponsivePaneProvider'
import AndroidBackHandlerProvider from '@/NativeMobileWeb/useAndroidBackHandler'
import ConfirmDeleteAccountContainer from '@/Components/ConfirmDeleteAccountModal/ConfirmDeleteAccountModal'
import DarkModeHandler from '../DarkModeHandler/DarkModeHandler'

type Props = {
  application: WebApplication
  mainApplicationGroup: ApplicationGroup
}

const ApplicationView: FunctionComponent<Props> = ({ application, mainApplicationGroup }) => {
  const platformString = getPlatformString()
  const [launched, setLaunched] = useState(false)
  const [needsUnlock, setNeedsUnlock] = useState(true)
  const [challenges, setChallenges] = useState<Challenge[]>([])

  const viewControllerManager = application.getViewControllerManager()

  const appColumnContainerRef = useRef<HTMLDivElement>(null)

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

  const handleDemoSignInFromParamsIfApplicable = useCallback(() => {
    const route = application.routeService.getRoute()
    if (route.type !== RouteType.Demo) {
      return
    }

    const token = route.demoParams.token
    if (!token || application.hasAccount()) {
      return
    }

    void application.sessions.populateSessionFromDemoShareToken(token)
  }, [application])

  const onAppLaunch = useCallback(() => {
    setLaunched(true)
    setNeedsUnlock(false)
    handleDemoSignInFromParamsIfApplicable()
  }, [handleDemoSignInFromParamsIfApplicable])

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
      } else if (eventName === ApplicationEvent.BiometricsSoftLockEngaged) {
        setNeedsUnlock(true)
      } else if (eventName === ApplicationEvent.BiometricsSoftLockDisengaged) {
        setNeedsUnlock(false)
      }
    })

    return () => {
      removeAppObserver()
    }
  }, [application, onAppLaunch, onAppStart])

  useEffect(() => {
    const removeObserver = application.addWebEventObserver(async (eventName, data) => {
      if (eventName === WebAppEvent.PanelResized) {
        if (!appColumnContainerRef.current) {
          return
        }

        const { panel, collapsed } = data as PanelResizedData

        if (panel === PANEL_NAME_NOTES) {
          if (collapsed) {
            appColumnContainerRef.current.classList.add('collapsed-notes')
          } else {
            appColumnContainerRef.current.classList.remove('collapsed-notes')
          }
        }

        if (panel === PANEL_NAME_NAVIGATION) {
          if (collapsed) {
            appColumnContainerRef.current.classList.add('collapsed-navigation')
          } else {
            appColumnContainerRef.current.classList.remove('collapsed-navigation')
          }
        }
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
    return challenges.map((challenge) => (
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
    ))
  }, [viewControllerManager, challenges, mainApplicationGroup, removeChallenge, application])

  if (!renderAppContents) {
    return <AndroidBackHandlerProvider application={application}>{renderChallenges()}</AndroidBackHandlerProvider>
  }

  return (
    <AndroidBackHandlerProvider application={application}>
      <DarkModeHandler application={application} />
      <ResponsivePaneProvider paneController={application.getViewControllerManager().paneController}>
        <PremiumModalProvider application={application} viewControllerManager={viewControllerManager}>
          <div className={platformString + ' main-ui-view sn-component h-full'}>
            <div id="app" className="app app-column-container" ref={appColumnContainerRef}>
              <FileDragNDropProvider
                application={application}
                featuresController={viewControllerManager.featuresController}
                filesController={viewControllerManager.filesController}
              >
                <Navigation application={application} />
                <ContentListView
                  application={application}
                  accountMenuController={viewControllerManager.accountMenuController}
                  filesController={viewControllerManager.filesController}
                  itemListController={viewControllerManager.itemListController}
                  navigationController={viewControllerManager.navigationController}
                  noAccountWarningController={viewControllerManager.noAccountWarningController}
                  notesController={viewControllerManager.notesController}
                  selectionController={viewControllerManager.selectionController}
                  searchOptionsController={viewControllerManager.searchOptionsController}
                  linkingController={viewControllerManager.linkingController}
                />
                <NoteGroupView application={application} />
              </FileDragNDropProvider>
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
                linkingController={viewControllerManager.linkingController}
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
              <ConfirmDeleteAccountContainer application={application} viewControllerManager={viewControllerManager} />
            </>
          </div>
        </PremiumModalProvider>
      </ResponsivePaneProvider>
    </AndroidBackHandlerProvider>
  )
}

export default ApplicationView

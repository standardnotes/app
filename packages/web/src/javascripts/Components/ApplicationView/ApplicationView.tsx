import { WebApplicationGroup } from '@/Application/WebApplicationGroup'
import { getPlatformString, isIOS } from '@/Utils'
import { ApplicationEvent, Challenge, removeFromArray, WebAppEvent } from '@standardnotes/snjs'
import { alertDialog, RouteType } from '@standardnotes/ui-services'
import { WebApplication } from '@/Application/WebApplication'
import Footer from '@/Components/Footer/Footer'
import SessionsModal from '@/Components/SessionsModal/SessionsModal'
import PreferencesViewWrapper from '@/Components/Preferences/PreferencesViewWrapper'
import ChallengeModal from '@/Components/ChallengeModal/ChallengeModal'
import NotesContextMenu from '@/Components/NotesContextMenu/NotesContextMenu'
import PurchaseFlowWrapper from '@/Components/PurchaseFlow/PurchaseFlowWrapper'
import { FunctionComponent, useCallback, useEffect, useMemo, useState, lazy, useRef } from 'react'
import RevisionHistoryModal from '@/Components/RevisionHistoryModal/RevisionHistoryModal'
import PremiumModalProvider from '@/Hooks/usePremiumModal'
import ConfirmSignoutContainer from '@/Components/ConfirmSignoutModal/ConfirmSignoutModal'
import { ToastContainer } from '@standardnotes/toast'
import FilePreviewModalWrapper from '@/Components/FilePreview/FilePreviewModal'
import FileContextMenuWrapper from '@/Components/FileContextMenu/FileContextMenu'
import PermissionsModalWrapper from '@/Components/PermissionsModal/PermissionsModalWrapper'
import TagContextMenuWrapper from '@/Components/Tags/TagContextMenuWrapper'
import FileDragNDropProvider from '../FileDragNDropProvider'
import ResponsivePaneProvider from '../Panes/ResponsivePaneProvider'
import AndroidBackHandlerProvider from '@/NativeMobileWeb/useAndroidBackHandler'
import ConfirmDeleteAccountContainer from '@/Components/ConfirmDeleteAccountModal/ConfirmDeleteAccountModal'
import ApplicationProvider from '../ApplicationProvider'
import CommandProvider from '../CommandProvider'
import PanesSystemComponent from '../Panes/PanesSystemComponent'
import DotOrgNotice from './DotOrgNotice'
import LinkingControllerProvider from '@/Controllers/LinkingControllerProvider'
import ImportModal from '../ImportModal/ImportModal'
import IosKeyboardClose from '../IosKeyboardClose/IosKeyboardClose'
import EditorWidthSelectionModalWrapper from '../EditorWidthSelectionModal/EditorWidthSelectionModal'
import { ProtectionEvent } from '@standardnotes/services'

type Props = {
  application: WebApplication
  mainApplicationGroup: WebApplicationGroup
}

const LazyLoadedClipperView = lazy(() => import('../ClipperView/ClipperView'))

const ApplicationView: FunctionComponent<Props> = ({ application, mainApplicationGroup }) => {
  const platformString = getPlatformString()
  const [launched, setLaunched] = useState(false)
  const [needsUnlock, setNeedsUnlock] = useState(true)
  const [challenges, setChallenges] = useState<Challenge[]>([])

  const currentWriteErrorDialog = useRef<Promise<void> | null>(null)
  const currentLoadErrorDialog = useRef<Promise<void> | null>(null)

  const viewControllerManager = application.controllers

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

    const status = application.status.addMessage('Preparing demo...')
    void application.user.populateSessionFromDemoShareToken(token).then(() => {
      application.status.removeMessage(status)
      application.hideAccountMenu()
    })
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
        if (!currentLoadErrorDialog.current) {
          alertDialog({
            text: 'Unable to load local database. Please restart the app and try again.',
          })
            .then(() => {
              currentLoadErrorDialog.current = null
            })
            .catch(console.error)
        }
      } else if (eventName === ApplicationEvent.LocalDatabaseWriteError) {
        if (!currentWriteErrorDialog.current) {
          currentWriteErrorDialog.current = alertDialog({
            text: 'Unable to write to local database. Please restart the app and try again.',
          })
            .then(() => {
              currentWriteErrorDialog.current = null
            })
            .catch(console.error)
        }
      }
    })

    return () => {
      removeAppObserver()
    }
  }, [application, onAppLaunch, onAppStart])

  useEffect(() => {
    const disposer = application.protections.addEventObserver(async (eventName) => {
      if (eventName === ProtectionEvent.BiometricsSoftLockEngaged) {
        setNeedsUnlock(true)
      } else if (eventName === ProtectionEvent.BiometricsSoftLockDisengaged) {
        setNeedsUnlock(false)
      }
    })

    return disposer
  }, [application])

  useEffect(() => {
    const removeObserver = application.addWebEventObserver(async (eventName) => {
      if (eventName === WebAppEvent.WindowDidFocus) {
        if (!(await application.protections.isLocked())) {
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

  const route = application.routeService.getRoute()

  if (route.type === RouteType.AppViewRoute && route.appViewRouteParam === 'extension') {
    return (
      <ApplicationProvider application={application}>
        <CommandProvider service={application.keyboardService}>
          <AndroidBackHandlerProvider application={application}>
            <ResponsivePaneProvider paneController={application.controllers.paneController}>
              <PremiumModalProvider
                application={application}
                featuresController={viewControllerManager.featuresController}
              >
                <LinkingControllerProvider controller={viewControllerManager.linkingController}>
                  <FileDragNDropProvider
                    application={application}
                    featuresController={viewControllerManager.featuresController}
                    filesController={viewControllerManager.filesController}
                  >
                    <LazyLoadedClipperView
                      viewControllerManager={viewControllerManager}
                      applicationGroup={mainApplicationGroup}
                    />
                    <ToastContainer />
                    <FilePreviewModalWrapper application={application} viewControllerManager={viewControllerManager} />
                    {renderChallenges()}
                  </FileDragNDropProvider>
                </LinkingControllerProvider>
              </PremiumModalProvider>
            </ResponsivePaneProvider>
          </AndroidBackHandlerProvider>
        </CommandProvider>
      </ApplicationProvider>
    )
  }

  return (
    <ApplicationProvider application={application}>
      <CommandProvider service={application.keyboardService}>
        <AndroidBackHandlerProvider application={application}>
          <ResponsivePaneProvider paneController={application.controllers.paneController}>
            <PremiumModalProvider
              application={application}
              featuresController={viewControllerManager.featuresController}
            >
              <LinkingControllerProvider controller={viewControllerManager.linkingController}>
                <div className={platformString + ' main-ui-view sn-component h-full'}>
                  <FileDragNDropProvider
                    application={application}
                    featuresController={viewControllerManager.featuresController}
                    filesController={viewControllerManager.filesController}
                  >
                    <PanesSystemComponent />
                  </FileDragNDropProvider>
                  <>
                    <Footer application={application} applicationGroup={mainApplicationGroup} />
                    <SessionsModal application={application} viewControllerManager={viewControllerManager} />
                    <PreferencesViewWrapper viewControllerManager={viewControllerManager} application={application} />
                    <RevisionHistoryModal
                      application={application}
                      historyModalController={viewControllerManager.historyModalController}
                      selectionController={viewControllerManager.selectionController}
                    />
                  </>
                  {renderChallenges()}
                  <>
                    <NotesContextMenu
                      navigationController={viewControllerManager.navigationController}
                      notesController={viewControllerManager.notesController}
                      linkingController={viewControllerManager.linkingController}
                      historyModalController={viewControllerManager.historyModalController}
                      selectionController={viewControllerManager.selectionController}
                    />
                    <TagContextMenuWrapper
                      navigationController={viewControllerManager.navigationController}
                      featuresController={viewControllerManager.featuresController}
                    />
                    <FileContextMenuWrapper
                      filesController={viewControllerManager.filesController}
                      selectionController={viewControllerManager.selectionController}
                      navigationController={viewControllerManager.navigationController}
                      linkingController={viewControllerManager.linkingController}
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
                    <EditorWidthSelectionModalWrapper />
                    <ConfirmDeleteAccountContainer
                      application={application}
                      viewControllerManager={viewControllerManager}
                    />
                    <ImportModal importModalController={viewControllerManager.importModalController} />
                  </>
                  {application.routeService.isDotOrg && <DotOrgNotice />}
                  {isIOS() && <IosKeyboardClose />}
                </div>
              </LinkingControllerProvider>
            </PremiumModalProvider>
          </ResponsivePaneProvider>
        </AndroidBackHandlerProvider>
      </CommandProvider>
    </ApplicationProvider>
  )
}

export default ApplicationView

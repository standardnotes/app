import { PANEL_NAME_NAVIGATION } from '@/Constants/Constants'
import { ElementIds } from '@/Constants/ElementIDs'
import { PaneComponentOptions } from '@/Controllers/PaneController'
import useIsTabletOrMobileScreen from '@/Hooks/useIsTabletOrMobileScreen'
import { ErrorBoundary } from '@/Utils/ErrorBoundary'
import { ApplicationEvent, classNames, PrefKey } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useState } from 'react'
import { usePrevious } from '../ContentListView/Calendar/usePrevious'
import ContentListView from '../ContentListView/ContentListView'
import NoteGroupView from '../NoteGroupView/NoteGroupView'
import PanelResizer, { PanelResizeType, PanelSide, ResizeFinishCallback } from '../PanelResizer/PanelResizer'
import { AppPaneId, AppPaneIdToDivId } from '../ResponsivePane/AppPaneMetadata'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'
import Navigation from '../Tags/Navigation'
import { useApplication } from './ApplicationProvider'
import {
  animatePaneEntranceTransitionFromOffscreenToTheRight,
  animatePaneExitTransitionOffscreenToTheRight,
} from '@/Components/ApplicationView/PaneAnimator'
import { isPanesChangeLeafDismiss, isPanesChangePush } from '@/Controllers/panesForLayout'
import { log, LoggingDomain } from '@/Logging'

const PLACEHOLDER_NAVIGATION_PANEL_WIDTH = 220

const PanesGrid = () => {
  const application = useApplication()
  const isTabletOrMobileScreenWrapped = useIsTabletOrMobileScreen()
  const { isTabletOrMobile, isTablet, isMobile } = isTabletOrMobileScreenWrapped
  const previousIsTabletOrMobileWrapped = usePrevious(isTabletOrMobileScreenWrapped)

  const paneController = useResponsiveAppPane()
  const previousPaneController = usePrevious(paneController)
  const [renderPanes, setRenderPanes] = useState<AppPaneId[]>([])
  const [panesPendingEntrance, setPanesPendingEntrance] = useState<AppPaneId[]>([])
  const [panesPendingExit, setPanesPendingExit] = useState<AppPaneId[]>([])

  const viewControllerManager = application.getViewControllerManager()

  const [navigationPanelWidth, setNavigationPanelWidth] = useState<number>(
    application.getPreference(PrefKey.TagsPanelWidth, PLACEHOLDER_NAVIGATION_PANEL_WIDTH),
  )
  const [navigationRef, setNavigationRef] = useState<HTMLDivElement | null>(null)
  const [showNavigationPanelResizer, setShowNavigationPanelResizer] = useState(false)

  const [_editorRef, setEditorRef] = useState<HTMLDivElement | null>(null)

  const animationsSupported = isMobile

  useEffect(() => {
    if (!animationsSupported) {
      return
    }

    const panes = paneController.panes
    const previousPanes = previousPaneController?.panes
    if (!previousPanes) {
      setPanesPendingEntrance([])
      return
    }

    const isPush = isPanesChangePush(previousPanes, panes)
    if (isPush) {
      setPanesPendingEntrance([panes[panes.length - 1]])
    }
  }, [paneController.panes, previousPaneController?.panes, animationsSupported])

  useEffect(() => {
    if (!animationsSupported) {
      return
    }

    const panes = paneController.panes
    const previousPanes = previousPaneController?.panes
    if (!previousPanes) {
      setPanesPendingExit([])
      return
    }

    const isExit = isPanesChangeLeafDismiss(previousPanes, panes)
    if (isExit) {
      setPanesPendingExit([previousPanes[previousPanes.length - 1]])
    }
  }, [paneController.panes, previousPaneController?.panes, animationsSupported])

  useEffect(() => {
    setRenderPanes(paneController.panes)
  }, [paneController.panes])

  useEffect(() => {
    if (!panesPendingEntrance || panesPendingEntrance?.length === 0) {
      return
    }

    if (panesPendingEntrance.length > 1) {
      console.warn('More than one pane pending entrance. This is not supported.')
      return
    }

    void animatePaneEntranceTransitionFromOffscreenToTheRight(AppPaneIdToDivId[panesPendingEntrance[0]]).then(() => {
      setPanesPendingEntrance([])
    })
  }, [panesPendingEntrance])

  useEffect(() => {
    if (!panesPendingExit || panesPendingExit?.length === 0) {
      return
    }

    if (panesPendingExit.length > 1) {
      console.warn('More than one pane pending exit. This is not supported.')
      return
    }

    void animatePaneExitTransitionOffscreenToTheRight(AppPaneIdToDivId[panesPendingExit[0]]).then(() => {
      setPanesPendingExit([])
    })
  }, [panesPendingExit])

  useEffect(() => {
    const removeObserver = application.addEventObserver(async () => {
      const width = application.getPreference(PrefKey.TagsPanelWidth, PLACEHOLDER_NAVIGATION_PANEL_WIDTH)
      setNavigationPanelWidth(width)
    }, ApplicationEvent.PreferencesChanged)

    return () => {
      removeObserver()
    }
  }, [application])

  const navigationPanelResizeWidthChangeCallback = useCallback((width: number) => {
    setNavigationPanelWidth(width)
  }, [])

  const navigationPanelResizeFinishCallback: ResizeFinishCallback = useCallback(
    (width, _lastLeft, _isMaxWidth, isCollapsed) => {
      application.setPreference(PrefKey.TagsPanelWidth, width).catch(console.error)
      application.publishPanelDidResizeEvent(PANEL_NAME_NAVIGATION, isCollapsed)
    },
    [application],
  )

  useEffect(() => {
    const showNavPanelResizer = !isTabletOrMobile && navigationRef != null
    if (showNavPanelResizer === showNavigationPanelResizer) {
      return
    }

    setShowNavigationPanelResizer(showNavPanelResizer)
    if (!showNavPanelResizer && navigationRef) {
      navigationRef.style.removeProperty('width')
    }
  }, [navigationRef, isTabletOrMobile, showNavigationPanelResizer])

  useEffect(() => {
    if (isTablet && !previousIsTabletOrMobileWrapped?.isTablet) {
      if (paneController.selectedPane !== AppPaneId.Navigation) {
        paneController.removePane(AppPaneId.Navigation)
      }
    } else if (
      !isTablet &&
      previousIsTabletOrMobileWrapped?.isTablet &&
      !paneController.panes.includes(AppPaneId.Navigation)
    ) {
      paneController.insertPaneAtIndex(AppPaneId.Navigation, 0)
    }
  }, [isTablet, paneController, previousIsTabletOrMobileWrapped])

  const computeStylesForContainer = (): React.CSSProperties => {
    const numPanes = paneController.panes.length

    if (isMobile) {
      return {}
    }

    if (numPanes === 1) {
      return {
        gridTemplateColumns: 'auto',
      }
    } else if (numPanes === 2) {
      if (isTablet) {
        return {
          gridTemplateColumns: '1fr 2fr',
        }
      } else {
        return {
          gridTemplateColumns: `${navigationPanelWidth}px auto`,
        }
      }
    } else if (numPanes === 3) {
      return {
        gridTemplateColumns: `${navigationPanelWidth}px 1fr 2fr`,
      }
    } else {
      return {}
    }
  }

  const computeClassesForPane = (_paneId: AppPaneId, isPendingEntrance: boolean): string => {
    if (isMobile) {
      return `content h-full absolute top-0 left-0 w-full ${
        isPendingEntrance ? 'translate-x-[100%]' : 'translate-x-0 '
      }`
    } else {
      return 'content flex h-full flex-col relative'
    }
  }

  const computeClassesForContainer = (): string => {
    if (isMobile) {
      return 'w-full'
    }

    return 'grid'
  }

  const renderPanesWithPendingExit = [...renderPanes, ...panesPendingExit]

  log(LoggingDomain.Panes, 'Rendering panes', renderPanesWithPendingExit)

  return (
    <div id="app" className={`app ${computeClassesForContainer()}`} style={{ ...computeStylesForContainer() }}>
      {renderPanesWithPendingExit.map((pane) => {
        const isPendingEntrance = panesPendingEntrance?.includes(pane)

        const options: PaneComponentOptions = {
          userWidth: pane === AppPaneId.Navigation ? navigationPanelWidth : undefined,
          className: computeClassesForPane(pane, isPendingEntrance ?? false),
        }

        if (pane === AppPaneId.Navigation) {
          return (
            <Navigation
              id={ElementIds.NavigationColumn}
              ref={setNavigationRef}
              className={classNames(options.className, isTabletOrMobile ? 'w-full' : '')}
              key="navigation-pane"
              application={application}
            >
              {showNavigationPanelResizer && navigationRef && (
                <PanelResizer
                  collapsable={true}
                  defaultWidth={150}
                  panel={navigationRef}
                  modifyElementWidth={false}
                  hoverable={true}
                  side={PanelSide.Right}
                  type={PanelResizeType.WidthOnly}
                  resizeFinishCallback={navigationPanelResizeFinishCallback}
                  width={options.userWidth ?? 0}
                  widthEventCallback={navigationPanelResizeWidthChangeCallback}
                  left={0}
                />
              )}
            </Navigation>
          )
        } else if (pane === AppPaneId.Items) {
          return (
            <ContentListView
              id={ElementIds.ItemsColumn}
              className={options.className}
              key={'content-list-view'}
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
          )
        } else if (pane === AppPaneId.Editor) {
          return (
            <ErrorBoundary key="editor-pane">
              <NoteGroupView
                id={ElementIds.EditorColumn}
                innerRef={(ref) => setEditorRef(ref)}
                className={options.className}
                application={application}
              />
            </ErrorBoundary>
          )
        }
      })}
    </div>
  )
}

export default observer(PanesGrid)

import { PANEL_NAME_NAVIGATION, PANEL_NAME_NOTES } from '@/Constants/Constants'
import { ElementIds } from '@/Constants/ElementIDs'
import useIsTabletOrMobileScreen from '@/Hooks/useIsTabletOrMobileScreen'
import { ErrorBoundary } from '@/Utils/ErrorBoundary'
import { ApplicationEvent, classNames, PrefKey } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useState } from 'react'
import { usePrevious } from '../ContentListView/Calendar/usePrevious'
import ContentListView from '../ContentListView/ContentListView'
import PanelResizer, { PanelResizeType, PanelSide, ResizeFinishCallback } from '../PanelResizer/PanelResizer'
import { AppPaneId, AppPaneIdToDivId } from './AppPaneMetadata'
import { useResponsiveAppPane } from './ResponsivePaneProvider'
import Navigation from '../Tags/Navigation'
import { useApplication } from '../ApplicationProvider'
import {
  animatePaneEntranceTransitionFromOffscreenToTheRight,
  animatePaneExitTransitionOffscreenToTheRight,
} from '@/Components/Panes/PaneAnimator'
import { isPanesChangeLeafDismiss, isPanesChangePush } from '@/Controllers/PaneController/panesForLayout'
import { log, LoggingDomain } from '@/Logging'
import { useMediaQuery } from '@/Hooks/useMediaQuery'
import EditorPane from '../NoteGroupView/EditorPane'

const NAVIGATION_PANEL_MIN_WIDTH = 48
const ITEMS_PANEL_MIN_WIDTH = 200
const NAVIGATION_PANEL_DEFAULT_WIDTH = 220
const ITEMS_PANEL_DEFAULT_WIDTH = 400

const PanesSystemComponent = () => {
  const application = useApplication()
  const isTabletOrMobileScreenWrapped = useIsTabletOrMobileScreen()
  const { isTabletOrMobile, isTablet, isMobile } = isTabletOrMobileScreenWrapped
  const previousIsTabletOrMobileWrapped = usePrevious(isTabletOrMobileScreenWrapped)

  const paneController = useResponsiveAppPane()
  const previousPaneController = usePrevious(paneController)
  const [renderPanes, setRenderPanes] = useState<AppPaneId[]>([])
  const [panesPendingEntrance, setPanesPendingEntrance] = useState<AppPaneId[]>([])
  const [panesPendingExit, setPanesPendingExit] = useState<AppPaneId[]>([])

  const [navigationPanelWidth, setNavigationPanelWidth] = useState<number>(
    application.getPreference(PrefKey.TagsPanelWidth, NAVIGATION_PANEL_DEFAULT_WIDTH),
  )
  const [navigationRef, setNavigationRef] = useState<HTMLDivElement | null>(null)

  const [itemsPanelWidth, setItemsPanelWidth] = useState<number>(
    application.getPreference(PrefKey.NotesPanelWidth, ITEMS_PANEL_DEFAULT_WIDTH),
  )
  const [listRef, setListRef] = useState<HTMLDivElement | null>(null)

  const showPanelResizers = !isTabletOrMobile

  const [_editorRef, setEditorRef] = useState<HTMLDivElement | null>(null)

  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const animationsSupported = isMobile && !prefersReducedMotion

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
      const width = application.getPreference(PrefKey.TagsPanelWidth, NAVIGATION_PANEL_DEFAULT_WIDTH)
      setNavigationPanelWidth(width)
    }, ApplicationEvent.PreferencesChanged)

    return () => {
      removeObserver()
    }
  }, [application])

  const navigationPanelResizeWidthChangeCallback = useCallback((width: number) => {
    setNavigationPanelWidth(width)
  }, [])

  const itemsPanelResizeWidthChangeCallback = useCallback((width: number) => {
    setItemsPanelWidth(width)
  }, [])

  const handleInitialItemsListPanelWidthLoad = useCallback((width: number) => {
    setItemsPanelWidth(width)
  }, [])

  const navigationPanelResizeFinishCallback: ResizeFinishCallback = useCallback(
    (width, _lastLeft, _isMaxWidth, isCollapsed) => {
      application.publishPanelDidResizeEvent(PANEL_NAME_NAVIGATION, width, isCollapsed)
    },
    [application],
  )

  const itemsPanelResizeFinishCallback: ResizeFinishCallback = useCallback(
    (width, _lastLeft, _isMaxWidth, isCollapsed) => {
      application.publishPanelDidResizeEvent(PANEL_NAME_NOTES, width, isCollapsed)
    },
    [application],
  )

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
    const panes = paneController.panes
    const numPanes = panes.length

    if (isMobile) {
      return {}
    }

    switch (numPanes) {
      case 1: {
        return {
          gridTemplateColumns: 'auto',
        }
      }
      case 2: {
        if (paneController.focusModeEnabled) {
          return {
            gridTemplateColumns: '0 1fr',
          }
        }
        if (isTablet) {
          return {
            gridTemplateColumns: '1fr 2fr',
          }
        } else {
          if (panes[0] === AppPaneId.Navigation) {
            return {
              gridTemplateColumns: `${navigationPanelWidth}px auto`,
            }
          } else {
            return {
              gridTemplateColumns: `${itemsPanelWidth}px auto`,
            }
          }
        }
      }
      case 3: {
        if (paneController.focusModeEnabled) {
          return {
            gridTemplateColumns: '0 0 1fr',
          }
        }
        return {
          gridTemplateColumns: `${navigationPanelWidth}px ${itemsPanelWidth}px 2fr`,
        }
      }
      default:
        return {}
    }
  }

  const computeClassesForPane = (_paneId: AppPaneId, isPendingEntrance: boolean, index: number): string => {
    const common = `app-pane app-pane-${index + 1} h-full content`

    if (isMobile) {
      return `absolute top-0 left-0 w-full flex flex-col ${common} ${
        isPendingEntrance ? 'translate-x-[100%]' : 'translate-x-0 '
      }`
    } else {
      return `flex flex-col relative overflow-hidden ${common}`
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
      {renderPanesWithPendingExit.map((pane, index) => {
        const isPendingEntrance = panesPendingEntrance?.includes(pane)

        const className = computeClassesForPane(pane, isPendingEntrance ?? false, index)

        if (pane === AppPaneId.Navigation) {
          return (
            <Navigation
              id={ElementIds.NavigationColumn}
              ref={setNavigationRef}
              className={classNames(className, isTabletOrMobile ? 'w-full' : '')}
              key="navigation-pane"
              application={application}
            >
              {showPanelResizers && navigationRef && (
                <PanelResizer
                  collapsable={true}
                  defaultWidth={navigationPanelWidth}
                  hoverable={true}
                  left={0}
                  minWidth={NAVIGATION_PANEL_MIN_WIDTH}
                  modifyElementWidth={false}
                  panel={navigationRef}
                  resizeFinishCallback={navigationPanelResizeFinishCallback}
                  side={PanelSide.Right}
                  type={PanelResizeType.WidthOnly}
                  width={navigationPanelWidth}
                  widthEventCallback={navigationPanelResizeWidthChangeCallback}
                />
              )}
            </Navigation>
          )
        } else if (pane === AppPaneId.Items) {
          return (
            <ContentListView
              id={ElementIds.ItemsColumn}
              className={className}
              ref={setListRef}
              key={'content-list-view'}
              application={application}
              onPanelWidthLoad={handleInitialItemsListPanelWidthLoad}
            >
              {showPanelResizers && listRef && (
                <PanelResizer
                  collapsable={true}
                  defaultWidth={ITEMS_PANEL_DEFAULT_WIDTH}
                  hoverable={true}
                  left={0}
                  minWidth={ITEMS_PANEL_MIN_WIDTH}
                  modifyElementWidth={false}
                  panel={listRef}
                  resizeFinishCallback={itemsPanelResizeFinishCallback}
                  side={PanelSide.Right}
                  type={PanelResizeType.WidthOnly}
                  width={itemsPanelWidth}
                  widthEventCallback={itemsPanelResizeWidthChangeCallback}
                />
              )}
            </ContentListView>
          )
        } else if (pane === AppPaneId.Editor) {
          return (
            <ErrorBoundary key="editor-pane">
              <EditorPane
                id={ElementIds.EditorColumn}
                ref={setEditorRef}
                className={className}
                application={application}
              />
            </ErrorBoundary>
          )
        }
      })}
    </div>
  )
}

export default observer(PanesSystemComponent)

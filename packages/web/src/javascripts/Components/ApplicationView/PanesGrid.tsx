import { PANEL_NAME_NAVIGATION } from '@/Constants/Constants'
import { ElementIds } from '@/Constants/ElementIDs'
import { PaneComponentOptions } from '@/Controllers/PaneController'
import useIsTabletOrMobileScreen from '@/Hooks/useIsTabletOrMobileScreen'
import { ErrorBoundary } from '@/Utils/ErrorBoundary'
import { ApplicationEvent, classNames, PrefKey } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePrevious } from '../ContentListView/Calendar/usePrevious'
import ContentListView from '../ContentListView/ContentListView'
import NoteGroupView from '../NoteGroupView/NoteGroupView'
import PanelResizer, { PanelResizeType, PanelSide, ResizeFinishCallback } from '../PanelResizer/PanelResizer'
import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'
import Navigation from '../Tags/Navigation'
import { useApplication } from './ApplicationProvider'

const BaseStyles: React.CSSProperties = {
  gridTemplateRows: 'auto',
}

const PanesGrid = () => {
  const application = useApplication()
  const isTabletOrMobileScreenWrapped = useIsTabletOrMobileScreen()
  const { isTabletOrMobile, isTablet, isMobile } = isTabletOrMobileScreenWrapped
  const previousIsTabletOrMobileWrapped = usePrevious(isTabletOrMobileScreenWrapped)

  const {
    panes,
    setPaneComponentProvider,
    getPaneComponent,
    selectedPane,
    removePane,
    insertPaneAtIndex,
    animatingEntraceOfPanes,
  } = useResponsiveAppPane()
  const viewControllerManager = application.getViewControllerManager()

  const [navigationPanelWidth, setNavigationPanelWidth] = useState<number>(0)
  const [navigationRef, setNavigationRef] = useState<HTMLDivElement | null>(null)
  const [showNavigationPanelResizer, setShowNavigationPanelResizer] = useState(false)

  const [_editorRef, setEditorRef] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    const removeObserver = application.addEventObserver(async () => {
      const width = application.getPreference(PrefKey.TagsPanelWidth)
      if (width) {
        setNavigationPanelWidth(width)
      }
    }, ApplicationEvent.PreferencesChanged)

    return () => {
      removeObserver()
    }
  }, [application])

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
      if (selectedPane !== AppPaneId.Navigation) {
        removePane(AppPaneId.Navigation)
      }
    } else if (!isTablet && previousIsTabletOrMobileWrapped?.isTablet && !panes.includes(AppPaneId.Navigation)) {
      insertPaneAtIndex(AppPaneId.Navigation, 0)
    }
  }, [isTablet, removePane, selectedPane, previousIsTabletOrMobileWrapped, insertPaneAtIndex, panes])

  useMemo(() => {
    setPaneComponentProvider(AppPaneId.Navigation, (options) => {
      return (
        <Navigation
          id={ElementIds.NavigationColumn}
          ref={setNavigationRef}
          className={classNames(options.className, isTabletOrMobile ? 'w-full' : 'w-[220px]')}
          key="navigation-pane"
          application={application}
        >
          {showNavigationPanelResizer && navigationRef && (
            <PanelResizer
              collapsable={true}
              defaultWidth={150}
              panel={navigationRef}
              hoverable={true}
              side={PanelSide.Right}
              type={PanelResizeType.WidthOnly}
              resizeFinishCallback={navigationPanelResizeFinishCallback}
              width={options.userWidth ?? 0}
              left={0}
            />
          )}
        </Navigation>
      )
    })

    setPaneComponentProvider(AppPaneId.Items, (options) => {
      return (
        <ContentListView
          id={ElementIds.ItemsColumn}
          className={options.className}
          key="content-list-pane"
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
    })

    setPaneComponentProvider(AppPaneId.Editor, (options) => {
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
    })
  }, [
    application,
    viewControllerManager,
    setPaneComponentProvider,
    navigationRef,
    navigationPanelResizeFinishCallback,
    showNavigationPanelResizer,
    isTabletOrMobile,
    animatingEntraceOfPanes,
  ])

  const computeStylesForContainer = (): React.CSSProperties => {
    const numPanes = panes.length

    if (isMobile) {
      return {}
    }

    if (numPanes === 1) {
      return {
        gridTemplateColumns: 'auto',
      }
    } else if (numPanes === 2) {
      return {
        gridTemplateColumns: 'auto 2fr',
      }
    } else if (numPanes === 3) {
      return {
        gridTemplateColumns: 'auto auto 2fr',
      }
    } else {
      return {}
    }
  }

  const computeClassesForPane = (_paneId: AppPaneId): string => {
    if (isMobile) {
      return 'content h-full absolute top-0 left-0 w-full'
    } else {
      return 'content flex h-full flex-col'
    }
  }

  const computeClassesForContainer = (): string => {
    if (isMobile) {
      return 'w-full'
    }

    return 'grid flex flex-row'
  }

  return (
    <div
      id="app"
      className={`app ${computeClassesForContainer()}`}
      style={{ ...BaseStyles, ...computeStylesForContainer() }}
    >
      {panes.map((pane) => {
        const options: PaneComponentOptions = {
          userWidth: pane === AppPaneId.Navigation ? navigationPanelWidth : undefined,
          className: computeClassesForPane(pane),
        }
        return getPaneComponent(pane, options)
      })}
    </div>
  )
}

export default observer(PanesGrid)

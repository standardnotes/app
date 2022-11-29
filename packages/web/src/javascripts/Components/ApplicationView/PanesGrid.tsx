import { PANEL_NAME_NAVIGATION } from '@/Constants/Constants'
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

const BaseClasses = 'grid flex flex-row'
const BaseStyles: React.CSSProperties = {
  gridTemplateRows: 'auto',
}

const PanesGrid = () => {
  const application = useApplication()
  const isTabletOrMobileScreenWrapped = useIsTabletOrMobileScreen()
  const { isTabletOrMobile, isTablet, isMobile } = isTabletOrMobileScreenWrapped
  const previousIsTabletOrMobileWrapped = usePrevious(isTabletOrMobileScreenWrapped)

  const { panes, setPaneComponentProvider, getPaneComponent, selectedPane, removePane, insertPaneAtIndex } =
    useResponsiveAppPane()
  const viewControllerManager = application.getViewControllerManager()

  const [navigationPanelWidth, setNavigationPanelWidth] = useState<number>(0)
  const [navigationRef, setNavigationRef] = useState<HTMLDivElement | null>(null)
  const [showNavigationPanelResizer, setShowNavigationPanelResizer] = useState(false)

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
    const show = !isTabletOrMobile && navigationRef != null
    if (show === showNavigationPanelResizer) {
      return
    }

    setShowNavigationPanelResizer(show)
    if (!show && navigationRef) {
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
          ref={setNavigationRef}
          className={classNames(
            isTabletOrMobile ? 'w-full' : 'w-[220px]',
            isMobile && selectedPane !== AppPaneId.Navigation ? '!w-0' : '',
          )}
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

    setPaneComponentProvider(AppPaneId.Items, () => {
      return (
        <ContentListView
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

    setPaneComponentProvider(AppPaneId.Editor, () => {
      return (
        <ErrorBoundary key="editor-pane">
          <NoteGroupView application={application} />
        </ErrorBoundary>
      )
    })
  }, [
    application,
    viewControllerManager,
    setPaneComponentProvider,
    selectedPane,
    navigationRef,
    navigationPanelResizeFinishCallback,
    showNavigationPanelResizer,
    isTabletOrMobile,
    isMobile,
  ])

  const computeStyles = (): React.CSSProperties => {
    const numPanes = panes.length

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

  return (
    <div id="app" className={`app ${BaseClasses}`} style={{ ...BaseStyles, ...computeStyles() }}>
      {panes.map((pane) => {
        return getPaneComponent(pane, { userWidth: pane === AppPaneId.Navigation ? navigationPanelWidth : undefined })
      })}
    </div>
  )
}

export default observer(PanesGrid)

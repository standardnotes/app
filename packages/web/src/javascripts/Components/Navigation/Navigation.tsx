import SmartViewsSection from '@/Components/Tags/SmartViewsSection'
import TagsSection from '@/Components/Tags/TagsSection'
import { WebApplication } from '@/Application/Application'
import { PANEL_NAME_NAVIGATION } from '@/Constants/Constants'
import { ApplicationEvent, PrefKey } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PanelResizer, { PanelSide, ResizeFinishCallback, PanelResizeType } from '@/Components/PanelResizer/PanelResizer'
import SearchBar from '@/Components/SearchBar/SearchBar'
import ResponsivePaneContent from '@/Components/ResponsivePane/ResponsivePaneContent'
import { AppPaneId } from '@/Components/ResponsivePane/PaneId'
import { classNames } from '@/Utils/ConcatenateClassNames'

type Props = {
  application: WebApplication
  selectedPane: AppPaneId
  togglePane: (paneId: AppPaneId) => void
}

const Navigation: FunctionComponent<Props> = ({ application, selectedPane, togglePane }) => {
  const viewControllerManager = useMemo(() => application.getViewControllerManager(), [application])
  const ref = useRef<HTMLDivElement>(null)
  const [panelWidth, setPanelWidth] = useState<number>(0)

  useEffect(() => {
    const removeObserver = application.addEventObserver(async () => {
      const width = application.getPreference(PrefKey.TagsPanelWidth)
      if (width) {
        setPanelWidth(width)
      }
    }, ApplicationEvent.PreferencesChanged)

    return () => {
      removeObserver()
    }
  }, [application])

  const panelResizeFinishCallback: ResizeFinishCallback = useCallback(
    (width, _lastLeft, _isMaxWidth, isCollapsed) => {
      application.setPreference(PrefKey.TagsPanelWidth, width).catch(console.error)
      viewControllerManager.noteTagsController.reloadTagsContainerMaxWidth()
      application.publishPanelDidResizeEvent(PANEL_NAME_NAVIGATION, isCollapsed)
    },
    [application, viewControllerManager],
  )

  const panelWidthEventCallback = useCallback(() => {
    viewControllerManager.noteTagsController.reloadTagsContainerMaxWidth()
  }, [viewControllerManager])

  return (
    <div
      id="navigation"
      className={classNames(
        'sn-component section app-column app-column-first',
        selectedPane === AppPaneId.Navigation && 'selected border-b border-solid border-border',
      )}
      ref={ref}
    >
      <ResponsivePaneContent
        paneId={AppPaneId.Navigation}
        selectedPane={selectedPane}
        togglePane={togglePane}
        contentElementId="navigation-content"
      >
        <SearchBar
          itemListController={viewControllerManager.itemListController}
          searchOptionsController={viewControllerManager.searchOptionsController}
        />
        <div className="section-title-bar">
          <div className="section-title-bar-header">
            <div className="title text-sm">
              <span className="font-bold">Views</span>
            </div>
          </div>
        </div>
        <div className="scrollable">
          <SmartViewsSection viewControllerManager={viewControllerManager} />
          <TagsSection viewControllerManager={viewControllerManager} />
        </div>
      </ResponsivePaneContent>
      {ref.current && (
        <PanelResizer
          collapsable={true}
          defaultWidth={150}
          panel={ref.current}
          hoverable={true}
          side={PanelSide.Right}
          type={PanelResizeType.WidthOnly}
          resizeFinishCallback={panelResizeFinishCallback}
          widthEventCallback={panelWidthEventCallback}
          width={panelWidth}
          left={0}
        />
      )}
    </div>
  )
}

export default observer(Navigation)

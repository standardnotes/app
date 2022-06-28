import SmartViewsSection from '@/Components/Tags/SmartViewsSection'
import TagsSection from '@/Components/Tags/TagsSection'
import { WebApplication } from '@/Application/Application'
import { PANEL_NAME_NAVIGATION } from '@/Constants/Constants'
import { ApplicationEvent, PrefKey } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react'
import PanelResizer, { PanelSide, ResizeFinishCallback, PanelResizeType } from '@/Components/PanelResizer/PanelResizer'
import SearchBar from '@/Components/SearchBar/SearchBar'

type Props = {
  application: WebApplication
}

const Navigation: FunctionComponent<Props> = ({ application }) => {
  const viewControllerManager = useMemo(() => application.getViewControllerManager(), [application])
  const [ref, setRef] = useState<HTMLDivElement | null>()
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
      className="sn-component section app-column app-column-first"
      data-aria-label="Navigation"
      ref={setRef}
    >
      <div id="navigation-content" className="content">
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
      </div>
      {ref && (
        <PanelResizer
          collapsable={true}
          defaultWidth={150}
          panel={ref}
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

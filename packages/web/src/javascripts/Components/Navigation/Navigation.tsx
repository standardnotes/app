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
import { AppPaneId } from '@/Components/ResponsivePane/AppPaneMetadata'
import { classNames } from '@/Utils/ConcatenateClassNames'
import Icon from '@/Components/Icon/Icon'

type Props = {
  application: WebApplication
}

const Navigation: FunctionComponent<Props> = ({ application }) => {
  const viewControllerManager = useMemo(() => application.getViewControllerManager(), [application])
  const ref = useRef<HTMLDivElement>(null)
  const [panelWidth, setPanelWidth] = useState<number>(0)
  const [isPanelExpanded, setIsPanelExpanded] = useState(true)

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
      className={`sn-component section app-column xsm-only:!w-full sm-only:!w-full ${
        isPanelExpanded ? 'md-only:!w-[220px] lg-only:!w-[220px]' : 'md-only:!w-18 lg-only:!w-18'
      } xl:w-[220px] md-only:transition-width lg-only:transition-width`}
      ref={ref}
    >
      <ResponsivePaneContent paneId={AppPaneId.Navigation} contentElementId="navigation-content">
        <SearchBar
          itemListController={viewControllerManager.itemListController}
          searchOptionsController={viewControllerManager.searchOptionsController}
          selectedViewTitle={viewControllerManager.navigationController.selected?.title}
        />
        <div
          className={`hidden w-fit items-end ${
            isPanelExpanded ? 'self-end' : 'self-end'
          } my-2 mr-2 rounded-full bg-white p-1 md:flex xl:hidden`}
          onClick={() => setIsPanelExpanded(!isPanelExpanded)}
        >
          <Icon type="chevron-down" className={`${isPanelExpanded ? 'rotate-90' : '-rotate-90'}`} />
        </div>
        <div className="section-title-bar block md:hidden xl:block">
          <div className="section-title-bar-header">
            <div className="title text-sm">
              <span className="font-bold">Views</span>
            </div>
          </div>
        </div>
        <div
          className={classNames(
            'h-full overflow-y-auto overflow-x-hidden',
            'md:overflow-y-hidden md:hover:overflow-y-auto',
            'md:hover:[overflow-y:_overlay]',
          )}
        >
          <SmartViewsSection viewControllerManager={viewControllerManager} showTitles={isPanelExpanded} />
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

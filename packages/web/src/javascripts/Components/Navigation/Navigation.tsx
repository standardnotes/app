import SmartViewsSection from '@/Components/Tags/SmartViewsSection'
import TagsSection from '@/Components/Tags/TagsSection'
import { WebApplication } from '@/Application/Application'
import { PANEL_NAME_NAVIGATION } from '@/Constants/Constants'
import { ApplicationEvent, PrefKey } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PanelResizer, { PanelSide, ResizeFinishCallback, PanelResizeType } from '@/Components/PanelResizer/PanelResizer'
import ResponsivePaneContent from '@/Components/ResponsivePane/ResponsivePaneContent'
import { AppPaneId } from '@/Components/ResponsivePane/AppPaneMetadata'
import { classNames } from '@/Utils/ConcatenateClassNames'

type Props = {
  application: WebApplication
}

const Navigation: FunctionComponent<Props> = ({ application }) => {
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
      className={'sn-component section app-column w-[220px] xsm-only:!w-full sm-only:!w-full'}
      ref={ref}
    >
      <ResponsivePaneContent paneId={AppPaneId.Navigation} contentElementId="navigation-content">
        <div className={'section-title-bar'}>
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

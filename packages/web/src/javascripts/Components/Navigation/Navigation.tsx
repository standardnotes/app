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
import Icon from '../Icon/Icon'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'

type Props = {
  application: WebApplication
}

const Navigation: FunctionComponent<Props> = ({ application }) => {
  const viewControllerManager = useMemo(() => application.getViewControllerManager(), [application])
  const ref = useRef<HTMLDivElement>(null)
  const [panelWidth, setPanelWidth] = useState<number>(0)
  const { toggleAppPane } = useResponsiveAppPane()

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
      className="sn-component section app-column h-screen max-h-screen w-[220px] overflow-hidden pb-8 md:h-full md:min-h-0 md:py-0 xsm-only:!w-full sm-only:!w-full"
      ref={ref}
    >
      <ResponsivePaneContent
        paneId={AppPaneId.Navigation}
        contentElementId="navigation-content"
        className={classNames(
          'flex-grow overflow-y-auto overflow-x-hidden md:overflow-y-hidden md:hover:overflow-y-auto',
          'md:hover:[overflow-y:_overlay]',
        )}
      >
        <div className="px-3.5 pt-2.5 md:hidden">
          <button
            className="flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-border bg-default text-neutral hover:bg-contrast focus:bg-contrast"
            onClick={() => {
              toggleAppPane(AppPaneId.Items)
            }}
            title="Go to items list"
            aria-label="Go to items list"
          >
            <Icon type="chevron-left" />
          </button>
        </div>
        <div className={'section-title-bar'}>
          <div className="section-title-bar-header">
            <div className="title text-sm">
              <span className="font-bold">Views</span>
            </div>
          </div>
        </div>
        <SmartViewsSection viewControllerManager={viewControllerManager} />
        <TagsSection viewControllerManager={viewControllerManager} />
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

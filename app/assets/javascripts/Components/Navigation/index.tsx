import { SmartViewsSection } from '@/Components/Tags/SmartViewsSection'
import { TagsSection } from '@/Components/Tags/TagsSection'
import { WebApplication } from '@/UIModels/Application'
import { PANEL_NAME_NAVIGATION } from '@/Constants'
import { ApplicationEvent, PrefKey } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'preact'
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks'
import { PanelSide, ResizeFinishCallback, PanelResizer, PanelResizeType } from '@/Components/PanelResizer'

type Props = {
  application: WebApplication
}

export const Navigation: FunctionComponent<Props> = observer(({ application }) => {
  const appState = useMemo(() => application.getAppState(), [application])
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
      appState.noteTags.reloadTagsContainerMaxWidth()
      appState.panelDidResize(PANEL_NAME_NAVIGATION, isCollapsed)
    },
    [application, appState],
  )

  const panelWidthEventCallback = useCallback(() => {
    appState.noteTags.reloadTagsContainerMaxWidth()
  }, [appState])

  return (
    <div
      id="navigation"
      className="sn-component section app-column app-column-first"
      data-aria-label="Navigation"
      ref={setRef}
    >
      <div id="navigation-content" className="content">
        <div className="section-title-bar">
          <div className="section-title-bar-header">
            <div className="sk-h3 title">
              <span className="sk-bold">Views</span>
            </div>
          </div>
        </div>
        <div className="scrollable">
          <SmartViewsSection appState={appState} />
          <TagsSection appState={appState} />
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
})

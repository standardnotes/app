import SmartViewsSection from '@/Components/Tags/SmartViewsSection'
import TagsSection from '@/Components/Tags/TagsSection'
import { WebApplication } from '@/Application/Application'
import { PANEL_NAME_NAVIGATION } from '@/Constants/Constants'
import { ApplicationEvent, PrefKey } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react'
import PanelResizer, { PanelSide, ResizeFinishCallback, PanelResizeType } from '@/Components/PanelResizer/PanelResizer'
import ResponsivePaneContent from '@/Components/ResponsivePane/ResponsivePaneContent'
import { AppPaneId } from '@/Components/ResponsivePane/AppPaneMetadata'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'
import { isIOS } from '@/Utils'
import UpgradeNow from '../Footer/UpgradeNow'
import RoundIconButton from '../Button/RoundIconButton'

type Props = {
  application: WebApplication
}

const Navigation: FunctionComponent<Props> = ({ application }) => {
  const viewControllerManager = useMemo(() => application.getViewControllerManager(), [application])
  const [panelElement, setPanelElement] = useState<HTMLDivElement>()
  const [panelWidth, setPanelWidth] = useState<number>(0)
  const { selectedPane, toggleAppPane } = useResponsiveAppPane()

  const [hasPasscode, setHasPasscode] = useState(() => application.hasPasscode())
  useEffect(() => {
    const removeObserver = application.addEventObserver(async () => {
      setHasPasscode(application.hasPasscode())
    }, ApplicationEvent.KeyStatusChanged)

    return removeObserver
  }, [application])

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
      application.publishPanelDidResizeEvent(PANEL_NAME_NAVIGATION, isCollapsed)
    },
    [application],
  )

  return (
    <div
      id="navigation"
      className={classNames(
        'sn-component section app-column h-screen max-h-screen overflow-hidden pt-safe-top md:h-full md:max-h-full md:min-h-0 md:pb-0',
        'w-[220px] xl:w-[220px] xsm-only:!w-full sm-only:!w-full',
        selectedPane === AppPaneId.Navigation
          ? 'pointer-coarse:md-only:!w-48 pointer-coarse:lg-only:!w-48'
          : 'pointer-coarse:md-only:!w-0 pointer-coarse:lg-only:!w-0',
        isIOS() ? 'pb-safe-bottom' : 'pb-2.5',
      )}
      ref={(element) => {
        if (element) {
          setPanelElement(element)
        }
      }}
    >
      <ResponsivePaneContent paneId={AppPaneId.Navigation} contentElementId="navigation-content">
        <div
          className={classNames(
            'flex-grow overflow-y-auto overflow-x-hidden md:overflow-y-hidden md:hover:overflow-y-auto pointer-coarse:md:overflow-y-auto',
            'md:hover:[overflow-y:_overlay]',
          )}
        >
          <div className={'section-title-bar'}>
            <div className="section-title-bar-header">
              <div className="title text-base md:text-sm">
                <span className="font-bold">Views</span>
              </div>
            </div>
          </div>
          <SmartViewsSection viewControllerManager={viewControllerManager} />
          <TagsSection viewControllerManager={viewControllerManager} />
        </div>
        <div className="flex items-center border-t border-border px-3.5 pt-2.5 md:hidden">
          <RoundIconButton
            className="mr-auto bg-default"
            onClick={() => {
              toggleAppPane(AppPaneId.Items)
            }}
            label="Go to items list"
            icon="chevron-left"
          />
          <UpgradeNow application={application} featuresController={viewControllerManager.featuresController} />
          <RoundIconButton
            className="ml-2.5 bg-default"
            onClick={() => {
              viewControllerManager.accountMenuController.toggleShow()
            }}
            label="Go to account menu"
            icon="account-circle"
          />
          {hasPasscode && (
            <RoundIconButton
              id="lock-item"
              onClick={() => application.lock()}
              label="Locks application and wipes unencrypted data from memory."
              className="ml-2.5 bg-default"
              icon="lock-filled"
            />
          )}
          <RoundIconButton
            className="ml-2.5 bg-default"
            onClick={() => {
              viewControllerManager.preferencesController.openPreferences()
            }}
            label="Go to preferences"
            icon="tune"
          />
          <RoundIconButton
            className="ml-2.5 bg-default"
            onClick={() => {
              viewControllerManager.quickSettingsMenuController.toggle()
            }}
            label="Go to quick settings menu"
            icon="themes"
          />
        </div>
      </ResponsivePaneContent>
      {panelElement && (
        <PanelResizer
          collapsable={true}
          defaultWidth={150}
          panel={panelElement}
          hoverable={true}
          side={PanelSide.Right}
          type={PanelResizeType.WidthOnly}
          resizeFinishCallback={panelResizeFinishCallback}
          width={panelWidth}
          left={0}
        />
      )}
    </div>
  )
}

export default observer(Navigation)

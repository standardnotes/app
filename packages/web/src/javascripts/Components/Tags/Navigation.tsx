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
import { classNames } from '@standardnotes/utils'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'
import UpgradeNow from '../Footer/UpgradeNow'
import RoundIconButton from '../Button/RoundIconButton'
import { isIOS } from '@/Utils'

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

  const NavigationFooter = useMemo(() => {
    return (
      <div
        className={classNames(
          'fixed bottom-0 flex min-h-[50px] w-full items-center border-t border-border bg-contrast',
          'px-3.5 pt-2.5 md:hidden',
          isIOS() ? 'pb-safe-bottom' : 'pb-2.5',
        )}
      >
        <RoundIconButton
          className="mr-auto bg-default"
          onClick={() => {
            toggleAppPane(AppPaneId.Items)
          }}
          label="Go to items list"
          icon="chevron-left"
        />
        <UpgradeNow
          application={application}
          subscriptionContoller={viewControllerManager.subscriptionController}
          featuresController={viewControllerManager.featuresController}
        />
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
    )
  }, [hasPasscode, application, viewControllerManager, toggleAppPane])

  return (
    <div
      id="navigation"
      className={classNames(
        'pb-[50px] md:pb-0',
        'sn-component section app-column h-full max-h-full overflow-hidden pt-safe-top md:h-full md:max-h-full md:min-h-0',
        'w-[220px] xl:w-[220px] xsm-only:!w-full sm-only:!w-full',
        selectedPane === AppPaneId.Navigation
          ? 'pointer-coarse:md-only:!w-48 pointer-coarse:lg-only:!w-48'
          : 'pointer-coarse:md-only:!w-0 pointer-coarse:lg-only:!w-0',
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
          <SmartViewsSection
            application={application}
            featuresController={viewControllerManager.featuresController}
            navigationController={viewControllerManager.navigationController}
          />
          <TagsSection viewControllerManager={viewControllerManager} />
        </div>
        {NavigationFooter}
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

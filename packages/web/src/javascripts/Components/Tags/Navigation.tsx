import SmartViewsSection from '@/Components/Tags/SmartViewsSection'
import TagsSection from '@/Components/Tags/TagsSection'
import { WebApplication } from '@/Application/WebApplication'
import { ApplicationEvent, PrefKey, WebAppEvent } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { forwardRef, useEffect, useState } from 'react'
import { classNames } from '@standardnotes/utils'
import { useResponsiveAppPane } from '../Panes/ResponsivePaneProvider'
import UpgradeNow from '../Footer/UpgradeNow'
import RoundIconButton from '../Button/RoundIconButton'
import { PanelResizedData } from '@/Types/PanelResizedData'
import { PANEL_NAME_NAVIGATION } from '@/Constants/Constants'
import { PaneLayout } from '@/Controllers/PaneController/PaneLayout'
import { usePaneSwipeGesture } from '../Panes/usePaneGesture'
import { mergeRefs } from '@/Hooks/mergeRefs'
import { useAvailableSafeAreaPadding } from '@/Hooks/useSafeAreaPadding'
import QuickSettingsButton from '../Footer/QuickSettingsButton'
import VaultSelectionButton from '../Footer/VaultSelectionButton'
import PreferencesButton from '../Footer/PreferencesButton'
import TagSearchBar from './TagSearchBar'

type Props = {
  application: WebApplication
  className?: string
  children?: React.ReactNode
  id: string
}

const Navigation = forwardRef<HTMLDivElement, Props>(({ application, className, children, id }, ref) => {
  const { setPaneLayout } = useResponsiveAppPane()

  const [hasPasscode, setHasPasscode] = useState(() => application.hasPasscode())
  useEffect(() => {
    const removeObserver = application.addEventObserver(async () => {
      setHasPasscode(application.hasPasscode())
    }, ApplicationEvent.KeyStatusChanged)

    return removeObserver
  }, [application])

  useEffect(() => {
    return application.addWebEventObserver((event, data) => {
      if (event === WebAppEvent.PanelResized) {
        const { panel, width } = data as PanelResizedData
        if (panel === PANEL_NAME_NAVIGATION) {
          application.setPreference(PrefKey.TagsPanelWidth, width).catch(console.error)
        }
      }
    })
  }, [application])

  const [setElement] = usePaneSwipeGesture(
    'left',
    (element) => {
      setPaneLayout(PaneLayout.ItemSelection)
      element.style.left = '0'
    },
    {
      gesture: 'swipe',
    },
  )

  const { hasBottomInset } = useAvailableSafeAreaPadding()

  return (
    <div
      id={id}
      className={classNames(
        className,
        'sn-component section pb-[50px] md:pb-0',
        'h-full max-h-full overflow-hidden pt-safe-top md:h-full md:max-h-full md:min-h-0',
      )}
      ref={mergeRefs([ref, setElement])}
    >
      <div id="navigation-content" className="flex-grow overflow-y-auto overflow-x-hidden">
        <TagSearchBar navigationController={application.navigationController} />
        <SmartViewsSection
          application={application}
          featuresController={application.featuresController}
          navigationController={application.navigationController}
        />
        <TagsSection />
      </div>
      <div
        className={classNames(
          'fixed bottom-0 flex min-h-[50px] w-full items-center border-t border-border bg-contrast',
          'px-3.5 pt-2.5 md:hidden',
          hasBottomInset ? 'pb-safe-bottom' : 'pb-2.5',
        )}
      >
        <RoundIconButton
          className="mr-auto bg-default"
          onClick={() => {
            setPaneLayout(PaneLayout.ItemSelection)
          }}
          label="Go to items list"
          icon="chevron-left"
        />
        <UpgradeNow
          application={application}
          subscriptionContoller={application.subscriptionController}
          featuresController={application.featuresController}
        />
        <RoundIconButton
          className="ml-2.5 bg-default"
          onClick={() => {
            application.accountMenuController.toggleShow()
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
        <PreferencesButton openPreferences={() => application.preferencesController.openPreferences()} />
        <QuickSettingsButton application={application} isMobileNavigation />
        {application.featuresController.isVaultsEnabled() && <VaultSelectionButton isMobileNavigation />}
      </div>
      {children}
    </div>
  )
})

export default observer(Navigation)

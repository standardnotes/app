import RoundIconButton from '@/Components/Button/RoundIconButton'
import { FunctionComponent, useEffect, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { PreferencesMenu } from './PreferencesMenu'
import PreferencesCanvas from './PreferencesCanvas'
import { PreferencesProps } from './PreferencesProps'
import { isIOS } from '@/Utils'
import { useDisableBodyScrollOnMobile } from '@/Hooks/useDisableBodyScrollOnMobile'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { MediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { useAndroidBackHandler } from '@/NativeMobileWeb/useAndroidBackHandler'
import { ESCAPE_COMMAND } from '@standardnotes/ui-services'

const PreferencesView: FunctionComponent<PreferencesProps> = ({
  application,
  viewControllerManager,
  closePreferences,
  userProvider,
  mfaProvider,
}) => {
  const isDesktopScreen = useMediaQuery(MediaQueryBreakpoints.md)

  const menu = useMemo(
    () => new PreferencesMenu(application, viewControllerManager.enableUnfinishedFeatures),
    [viewControllerManager.enableUnfinishedFeatures, application],
  )

  useEffect(() => {
    menu.selectPane(viewControllerManager.preferencesController.currentPane)
    const removeEscKeyObserver = application.keyboardService.addCommandHandler({
      command: ESCAPE_COMMAND,
      onKeyDown: (event) => {
        event.preventDefault()
        closePreferences()
      },
    })
    return () => {
      removeEscKeyObserver()
    }
  }, [menu, viewControllerManager.preferencesController.currentPane, application.keyboardService, closePreferences])

  useDisableBodyScrollOnMobile()

  const addAndroidBackHandler = useAndroidBackHandler()

  useEffect(() => {
    const removeListener = addAndroidBackHandler(() => {
      closePreferences()
      return true
    })
    return () => {
      if (removeListener) {
        removeListener()
      }
    }
  }, [addAndroidBackHandler, closePreferences])

  return (
    <div
      className={classNames(
        'absolute top-0 left-0 z-preferences flex h-full w-full flex-col bg-default pt-safe-top',
        isIOS() ? 'pb-safe-bottom' : 'pb-2 md:pb-0',
      )}
      style={{
        top: !isDesktopScreen ? `${document.documentElement.scrollTop}px` : '',
      }}
    >
      <div className="flex w-full flex-row items-center justify-between border-b border-solid border-border bg-default px-3 py-2 md:p-3">
        <div className="hidden h-8 w-8 md:block" />
        <h1 className="text-base font-bold md:text-lg">Your preferences for Standard Notes</h1>
        <RoundIconButton
          onClick={() => {
            closePreferences()
          }}
          icon="close"
          label="Close preferences"
        />
      </div>
      <PreferencesCanvas
        menu={menu}
        application={application}
        viewControllerManager={viewControllerManager}
        closePreferences={closePreferences}
        userProvider={userProvider}
        mfaProvider={mfaProvider}
      />
    </div>
  )
}

export default observer(PreferencesView)

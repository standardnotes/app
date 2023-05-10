import RoundIconButton from '@/Components/Button/RoundIconButton'
import { FunctionComponent, useEffect, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { PreferencesMenu } from './PreferencesMenu'
import PreferencesCanvas from './PreferencesCanvas'
import { PreferencesProps } from './PreferencesProps'
import { useDisableBodyScrollOnMobile } from '@/Hooks/useDisableBodyScrollOnMobile'
import { useAndroidBackHandler } from '@/NativeMobileWeb/useAndroidBackHandler'
import Modal from '../Modal/Modal'
import { classNames } from '@standardnotes/snjs'
import { useCommandService } from '../CommandProvider'
import { ESCAPE_COMMAND } from '@standardnotes/ui-services'
import { useAvailableSafeAreaPadding } from '@/Hooks/useSafeAreaPadding'

const PreferencesView: FunctionComponent<PreferencesProps> = ({
  application,
  viewControllerManager,
  closePreferences,
  userProvider,
  mfaProvider,
}) => {
  const commandService = useCommandService()

  const menu = useMemo(
    () => new PreferencesMenu(application, viewControllerManager.enableUnfinishedFeatures),
    [viewControllerManager.enableUnfinishedFeatures, application],
  )

  useEffect(() => {
    menu.selectPane(viewControllerManager.preferencesController.currentPane)
  }, [menu, viewControllerManager.preferencesController.currentPane])

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

  useEffect(() => {
    return commandService.addCommandHandler({
      command: ESCAPE_COMMAND,
      onKeyDown: () => {
        closePreferences()
        return true
      },
    })
  }, [commandService, closePreferences])

  const { hasTopInset } = useAvailableSafeAreaPadding()

  return (
    <Modal
      close={closePreferences}
      title="Preferences"
      className={{
        content: 'md:h-full md:!max-h-full md:!w-full',
        description: 'flex flex-col',
      }}
      customHeader={
        <div
          className={classNames(
            'flex w-full flex-row items-center justify-between border-b border-solid border-border bg-default px-3 pb-2 md:p-3',
            hasTopInset ? 'pt-safe-top' : 'pt-2',
          )}
        >
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
      }
    >
      <PreferencesCanvas
        menu={menu}
        application={application}
        viewControllerManager={viewControllerManager}
        closePreferences={closePreferences}
        userProvider={userProvider}
        mfaProvider={mfaProvider}
      />
    </Modal>
  )
}

export default observer(PreferencesView)

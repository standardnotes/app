import RoundIconButton from '@/Components/Button/RoundIconButton'
import { FunctionComponent, useEffect, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { PreferencesMenu } from './PreferencesMenu'
import PreferencesCanvas from './PreferencesCanvas'
import { PreferencesProps } from './PreferencesProps'
import { useDisableBodyScrollOnMobile } from '@/Hooks/useDisableBodyScrollOnMobile'
import { useAndroidBackHandler } from '@/NativeMobileWeb/useAndroidBackHandler'
import { ESCAPE_COMMAND } from '@standardnotes/ui-services'
import Modal from '../Shared/Modal'
import { AlertDialogLabel } from '@reach/alert-dialog'

const PreferencesView: FunctionComponent<PreferencesProps> = ({
  application,
  viewControllerManager,
  closePreferences,
  userProvider,
  mfaProvider,
}) => {
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
    <Modal
      isOpen={true}
      close={closePreferences}
      title="Preferences"
      className={{
        overlay: 'p-0',
        content: 'md:h-full md:!max-h-full md:w-full',
        description: 'flex flex-col',
      }}
      customHeader={
        <AlertDialogLabel className="flex w-full flex-row items-center justify-between border-b border-solid border-border bg-default px-3 py-2 md:p-3">
          <div className="hidden h-8 w-8 md:block" />
          <h1 className="text-base font-bold md:text-lg">Your preferences for Standard Notes</h1>
          <RoundIconButton
            onClick={() => {
              closePreferences()
            }}
            icon="close"
            label="Close preferences"
          />
        </AlertDialogLabel>
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

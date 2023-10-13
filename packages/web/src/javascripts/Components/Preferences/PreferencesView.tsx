import RoundIconButton from '@/Components/Button/RoundIconButton'
import { FunctionComponent, useEffect, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { PreferencesSessionController } from './Controller/PreferencesSessionController'
import PreferencesCanvas from './PreferencesCanvas'
import { PreferencesProps } from './PreferencesProps'
import { useAndroidBackHandler } from '@/NativeMobileWeb/useAndroidBackHandler'
import Modal, { ModalAction } from '../Modal/Modal'
import { classNames } from '@standardnotes/snjs'
import { useAvailableSafeAreaPadding } from '@/Hooks/useSafeAreaPadding'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import Icon from '../Icon/Icon'

const PreferencesView: FunctionComponent<PreferencesProps> = ({ application, closePreferences }) => {
  const menu = useMemo(
    () => new PreferencesSessionController(application, application.enableUnfinishedFeatures),
    [application],
  )

  useEffect(() => {
    menu.selectPane(application.preferencesController.currentPane)
  }, [menu, application.preferencesController.currentPane])

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

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

  const { hasTopInset } = useAvailableSafeAreaPadding()

  const modalActions = useMemo(
    (): ModalAction[] => [
      {
        label: (
          <span className="flex items-center">
            <Icon type="chevron-left" size="large" />
            Back
          </span>
        ),
        type: 'primary',
        mobileSlot: 'left',
        onClick: closePreferences,
      },
    ],
    [closePreferences],
  )

  return (
    <Modal
      close={closePreferences}
      title="Preferences"
      className="flex flex-col"
      customHeader={
        <div
          className={classNames(
            'flex w-full flex-row items-center justify-between border-b border-solid border-border bg-default px-3 pb-2 md:p-3',
            hasTopInset ? 'pt-safe-top' : 'pt-2',
          )}
          data-preferences-header
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
      disableCustomHeader={isMobileScreen}
      actions={modalActions}
      customFooter={<></>}
    >
      <PreferencesCanvas menu={menu} application={application} closePreferences={closePreferences} />
    </Modal>
  )
}

export default observer(PreferencesView)

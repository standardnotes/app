import { FunctionComponent, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import PreferencesView from './PreferencesView'
import { PreferencesViewWrapperProps } from './PreferencesViewWrapperProps'
import { useKeyboardService } from '../KeyboardServiceProvider'
import { OPEN_PREFERENCES_COMMAND } from '@standardnotes/ui-services'
import ModalOverlay from '../Modal/ModalOverlay'
import { usePaneSwipeGesture } from '../Panes/usePaneGesture'
import { performSafariAnimationFix } from '../Panes/PaneAnimator'
import { IosModalAnimationEasing } from '../Modal/useModalAnimation'

const PreferencesViewWrapper: FunctionComponent<PreferencesViewWrapperProps> = ({ application }) => {
  const keyboardService = useKeyboardService()

  useEffect(() => {
    return keyboardService.addCommandHandler({
      command: OPEN_PREFERENCES_COMMAND,
      category: 'General',
      description: 'Open preferences',
      onKeyDown: () => application.preferencesController.openPreferences(),
    })
  }, [keyboardService, application])
  useEffect(() =>
    application.commands.addCommand(
      'Open preferences',
      () => application.preferencesController.openPreferences(),
      'tune',
    ),
  )

  const [setElement] = usePaneSwipeGesture('right', async (element) => {
    const animation = element.animate(
      [
        {
          transform: 'translateX(100%)',
          opacity: 0,
        },
      ],
      {
        easing: IosModalAnimationEasing,
        duration: 250,
        fill: 'both',
      },
    )

    await animation.finished

    performSafariAnimationFix(element)

    animation.finish()

    application.preferencesController.closePreferences()
  })

  return (
    <ModalOverlay
      isOpen={application.preferencesController.isOpen}
      ref={setElement}
      animate="mobile"
      animationVariant="horizontal"
      close={application.preferencesController.closePreferences}
      className="md:h-full md:!max-h-full md:!w-full md:!border-0"
    >
      <PreferencesView
        closePreferences={application.preferencesController.closePreferences}
        application={application}
      />
    </ModalOverlay>
  )
}

export default observer(PreferencesViewWrapper)

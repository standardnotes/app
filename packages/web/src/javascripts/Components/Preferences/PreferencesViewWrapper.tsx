import { FunctionComponent, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import PreferencesView from './PreferencesView'
import { PreferencesViewWrapperProps } from './PreferencesViewWrapperProps'
import { useCommandService } from '../CommandProvider'
import { OPEN_PREFERENCES_COMMAND } from '@standardnotes/ui-services'
import ModalOverlay from '../Modal/ModalOverlay'
import { usePaneSwipeGesture } from '../Panes/usePaneGesture'
import { performSafariAnimationFix } from '../Panes/PaneAnimator'
import { IosModalAnimationEasing } from '../Modal/useModalAnimation'

const PreferencesViewWrapper: FunctionComponent<PreferencesViewWrapperProps> = ({
  viewControllerManager,
  application,
}) => {
  const commandService = useCommandService()

  useEffect(() => {
    return commandService.addCommandHandler({
      command: OPEN_PREFERENCES_COMMAND,
      onKeyDown: () => viewControllerManager.preferencesController.openPreferences(),
    })
  }, [commandService, viewControllerManager])

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

    viewControllerManager.preferencesController.closePreferences()
  })

  return (
    <ModalOverlay isOpen={viewControllerManager.preferencesController.isOpen} ref={setElement}>
      <PreferencesView
        closePreferences={viewControllerManager.preferencesController.closePreferences}
        application={application}
        viewControllerManager={viewControllerManager}
        mfaProvider={application}
        userProvider={application}
      />
    </ModalOverlay>
  )
}

export default observer(PreferencesViewWrapper)

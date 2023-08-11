import { observer } from 'mobx-react-lite'
import { FunctionComponent, useEffect } from 'react'
import HistoryModalDialogContent from './HistoryModalDialogContent'
import HistoryModalDialog from './HistoryModalDialog'
import { RevisionHistoryModalProps } from './RevisionHistoryModalProps'
import { useAndroidBackHandler } from '@/NativeMobileWeb/useAndroidBackHandler'
import { useModalAnimation } from '../Modal/useModalAnimation'
import { useMediaQuery, MutuallyExclusiveMediaQueryBreakpoints } from '@/Hooks/useMediaQuery'

const RevisionHistoryModal: FunctionComponent<RevisionHistoryModalProps> = ({ application }) => {
  const addAndroidBackHandler = useAndroidBackHandler()

  const isOpen = Boolean(
    application.historyModalController.note &&
      application.isAuthorizedToRenderItem(application.historyModalController.note),
  )

  useEffect(() => {
    let removeListener: (() => void) | undefined

    if (isOpen) {
      removeListener = addAndroidBackHandler(() => {
        application.historyModalController.dismissModal()
        return true
      })
    }

    return () => {
      if (removeListener) {
        removeListener()
      }
    }
  }, [addAndroidBackHandler, application, isOpen])

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)
  const [isMounted, setElement] = useModalAnimation(isOpen, isMobileScreen)

  if (!isMounted) {
    return null
  }

  return (
    <HistoryModalDialog onDismiss={application.historyModalController.dismissModal} ref={setElement}>
      {!!application.historyModalController.note && (
        <HistoryModalDialogContent
          application={application}
          dismissModal={application.historyModalController.dismissModal}
          note={application.historyModalController.note}
        />
      )}
    </HistoryModalDialog>
  )
}

export default observer(RevisionHistoryModal)

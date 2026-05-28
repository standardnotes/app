import { FunctionComponent, useCallback, useMemo, useState } from 'react'

import { WebApplication } from '@/Application/WebApplication'
import { isEmailValid } from '@/Utils'
import { SubscriptionController } from '@/Controllers/Subscription/SubscriptionController'

import InviteForm from './InviteForm'
import InviteSuccess from './InviteSuccess'
import Modal, { ModalAction } from '@/Components/Modal/Modal'
import { c } from 'ttag'

enum Steps {
  InitialStep,
  FinishStep,
}

type Props = {
  onCloseDialog: () => void
  application: WebApplication
  subscriptionState: SubscriptionController
}

const Invite: FunctionComponent<Props> = ({ onCloseDialog, application, subscriptionState }) => {
  const [submitButtonTitle, setSubmitButtonTitle] = useState(() => c('Action').t`Invite`)
  const [inviteeEmail, setInviteeEmail] = useState('')
  const [isContinuing, setIsContinuing] = useState(false)
  const [lockContinue, setLockContinue] = useState(false)
  const [currentStep, setCurrentStep] = useState(Steps.InitialStep)

  const validateInviteeEmail = useCallback(async () => {
    if (!isEmailValid(inviteeEmail)) {
      application.alerts
        .alert(c('Error').t`The email you entered has an invalid format. Please review your input and try again.`)
        .catch(console.error)

      return false
    }

    return true
  }, [application.alerts, inviteeEmail])

  const handleDialogClose = useCallback(() => {
    if (lockContinue) {
      application.alerts.alert(c('Info').t`Cannot close window until pending tasks are complete.`).catch(console.error)
    } else {
      onCloseDialog()
    }
  }, [application.alerts, lockContinue, onCloseDialog])

  const resetProgressState = () => {
    setSubmitButtonTitle(c('Action').t`Invite`)
    setIsContinuing(false)
  }

  const processInvite = useCallback(async () => {
    setLockContinue(true)

    const success = await subscriptionState.sendSubscriptionInvitation(inviteeEmail)

    setLockContinue(false)

    return success
  }, [inviteeEmail, subscriptionState])

  const handleSubmit = useCallback(async () => {
    if (lockContinue || isContinuing) {
      return
    }

    if (currentStep === Steps.FinishStep) {
      handleDialogClose()

      return
    }

    setIsContinuing(true)
    setSubmitButtonTitle(c('Action').t`Sending...`)

    const valid = await validateInviteeEmail()

    if (!valid) {
      resetProgressState()

      return
    }

    const success = await processInvite()
    if (!success) {
      application.alerts
        .alert(
          c('Error')
            .t`An error occurred while sending the invite. Please try again or contact support if the issue persists.`,
        )
        .catch(console.error)

      resetProgressState()

      return
    }

    setIsContinuing(false)
    setSubmitButtonTitle(c('Action').t`Finish`)
    setCurrentStep(Steps.FinishStep)
  }, [
    application.alerts,
    currentStep,
    handleDialogClose,
    isContinuing,
    lockContinue,
    processInvite,
    validateInviteeEmail,
  ])

  const modalActions = useMemo(
    (): ModalAction[] => [
      {
        label: submitButtonTitle,
        onClick: handleSubmit,
        type: 'primary',
        mobileSlot: 'right',
        disabled: lockContinue,
      },
      {
        label: c('Action').t`Cancel`,
        onClick: handleDialogClose,
        type: 'cancel',
        mobileSlot: 'left',
        hidden: currentStep === Steps.FinishStep,
      },
    ],
    [currentStep, handleDialogClose, handleSubmit, lockContinue, submitButtonTitle],
  )

  return (
    <Modal title={c('Title').t`Share Your Subscription`} close={handleDialogClose} actions={modalActions}>
      <div className="px-4.5 py-4">
        {currentStep === Steps.InitialStep && <InviteForm setInviteeEmail={setInviteeEmail} />}
        {currentStep === Steps.FinishStep && <InviteSuccess />}
      </div>
    </Modal>
  )
}

export default Invite

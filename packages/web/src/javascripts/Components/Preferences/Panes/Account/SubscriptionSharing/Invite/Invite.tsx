import { FunctionComponent, useState } from 'react'

import ModalDialog from '@/Components/Shared/ModalDialog'
import ModalDialogButtons from '@/Components/Shared/ModalDialogButtons'
import ModalDialogDescription from '@/Components/Shared/ModalDialogDescription'
import ModalDialogLabel from '@/Components/Shared/ModalDialogLabel'
import Button from '@/Components/Button/Button'
import { WebApplication } from '@/Application/Application'
import { useBeforeUnload } from '@/Hooks/useBeforeUnload'
import { isEmailValid } from '@/Utils'

import InviteForm from './InviteForm'
import InviteSuccess from './InviteSuccess'

enum SubmitButtonTitles {
  Default = 'Send Invitation',
  Sending = 'Sending...',
  Finish = 'Finish',
}

enum Steps {
  InitialStep,
  FinishStep,
}

type Props = {
  onCloseDialog: () => void
  application: WebApplication
}

const Invite: FunctionComponent<Props> = ({ onCloseDialog, application }) => {
  const [submitButtonTitle, setSubmitButtonTitle] = useState(SubmitButtonTitles.Default)
  const [inviteeEmail, setInviteeEmail] = useState('')
  const [isContinuing, setIsContinuing] = useState(false)
  const [lockContinue, setLockContinue] = useState(false)
  const [currentStep, setCurrentStep] = useState(Steps.InitialStep)

  useBeforeUnload()

  const applicationAlertService = application.alertService

  const validateInviteeEmail = async () => {
    if (!isEmailValid(inviteeEmail)) {
      applicationAlertService
        .alert('The email you entered has an invalid format. Please review your input and try again.')
        .catch(console.error)

      return false
    }

    return true
  }

  const handleDialogClose = () => {
    if (lockContinue) {
      applicationAlertService.alert('Cannot close window until pending tasks are complete.').catch(console.error)
    } else {
      onCloseDialog()
    }
  }

  const resetProgressState = () => {
    setSubmitButtonTitle(SubmitButtonTitles.Default)
    setIsContinuing(false)
  }

  const processInvite = async () => {
    setLockContinue(true)

    const success = await application.subscriptions.inviteToSubscription(inviteeEmail)

    setLockContinue(false)

    return success
  }

  const handleSubmit = async () => {
    if (lockContinue || isContinuing) {
      return
    }

    if (currentStep === Steps.FinishStep) {
      handleDialogClose()

      return
    }

    setIsContinuing(true)
    setSubmitButtonTitle(SubmitButtonTitles.Sending)

    const valid = await validateInviteeEmail()

    if (!valid) {
      resetProgressState()

      return
    }

    const success = await processInvite()
    if (!success) {
      resetProgressState()

      return
    }

    setIsContinuing(false)
    setSubmitButtonTitle(SubmitButtonTitles.Finish)
    setCurrentStep(Steps.FinishStep)
  }

  return (
    <div>
      <ModalDialog>
        <ModalDialogLabel closeDialog={handleDialogClose}>Invite</ModalDialogLabel>
        <ModalDialogDescription className="flex flex-row items-center px-4.5">
          {currentStep === Steps.InitialStep && (
            <InviteForm setInviteeEmail={setInviteeEmail} />
          )}
          {currentStep === Steps.FinishStep && <InviteSuccess />}
        </ModalDialogDescription>
        <ModalDialogButtons className="px-4.5">
          <Button className="min-w-20" primary label={submitButtonTitle} onClick={handleSubmit} />
        </ModalDialogButtons>
      </ModalDialog>
    </div>
  )
}

export default Invite

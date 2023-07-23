import { FunctionComponent, useCallback, useMemo, useState } from 'react'
import { WebApplication } from '@/Application/WebApplication'
import { useBeforeUnload } from '@/Hooks/useBeforeUnload'
import ChangeEmailForm from './ChangeEmailForm'
import ChangeEmailSuccess from './ChangeEmailSuccess'
import Modal, { ModalAction } from '@/Components/Modal/Modal'

enum SubmitButtonTitles {
  Default = 'Continue',
  GeneratingKeys = 'Generating Keys...',
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

const ChangeEmail: FunctionComponent<Props> = ({ onCloseDialog, application }) => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [isContinuing, setIsContinuing] = useState(false)
  const [lockContinue, setLockContinue] = useState(false)
  const [submitButtonTitle, setSubmitButtonTitle] = useState(SubmitButtonTitles.Default)
  const [currentStep, setCurrentStep] = useState(Steps.InitialStep)

  useBeforeUnload()

  const applicationAlertService = application.alerts

  const validateCurrentPassword = useCallback(async () => {
    if (!currentPassword || currentPassword.length === 0) {
      applicationAlertService.alert('Please enter your current password.').catch(console.error)

      return false
    }

    const success = await application.validateAccountPassword(currentPassword)
    if (!success) {
      applicationAlertService
        .alert('The current password you entered is not correct. Please try again.')
        .catch(console.error)

      return false
    }

    return success
  }, [application, applicationAlertService, currentPassword])

  const resetProgressState = () => {
    setSubmitButtonTitle(SubmitButtonTitles.Default)
    setIsContinuing(false)
  }

  const processEmailChange = useCallback(async () => {
    await application.performDesktopTextBackup()

    setLockContinue(true)

    const response = await application.changeEmail(newEmail, currentPassword)

    const success = !response.error

    setLockContinue(false)

    return success
  }, [application, currentPassword, newEmail])

  const dismiss = useCallback(() => {
    if (lockContinue) {
      applicationAlertService.alert('Cannot close window until pending tasks are complete.').catch(console.error)
    } else {
      onCloseDialog()
    }
  }, [applicationAlertService, lockContinue, onCloseDialog])

  const handleSubmit = useCallback(async () => {
    if (lockContinue || isContinuing) {
      return
    }

    if (currentStep === Steps.FinishStep) {
      dismiss()

      return
    }

    setIsContinuing(true)
    setSubmitButtonTitle(SubmitButtonTitles.GeneratingKeys)

    const valid = await validateCurrentPassword()

    if (!valid) {
      resetProgressState()

      return
    }

    const success = await processEmailChange()
    if (!success) {
      resetProgressState()

      return
    }

    setIsContinuing(false)
    setSubmitButtonTitle(SubmitButtonTitles.Finish)
    setCurrentStep(Steps.FinishStep)
  }, [currentStep, dismiss, isContinuing, lockContinue, processEmailChange, validateCurrentPassword])

  const handleDialogClose = useCallback(() => {
    if (lockContinue) {
      applicationAlertService.alert('Cannot close window until pending tasks are complete.').catch(console.error)
    } else {
      onCloseDialog()
    }
  }, [applicationAlertService, lockContinue, onCloseDialog])

  const modalActions = useMemo(
    (): ModalAction[] => [
      {
        label: 'Cancel',
        onClick: handleDialogClose,
        type: 'cancel',
        mobileSlot: 'left',
      },
      {
        label: submitButtonTitle,
        onClick: handleSubmit,
        type: 'primary',
        mobileSlot: 'right',
      },
    ],
    [handleDialogClose, handleSubmit, submitButtonTitle],
  )

  return (
    <Modal title="Change Email" close={handleDialogClose} actions={modalActions}>
      <div className="px-4.5 py-4">
        {currentStep === Steps.InitialStep && (
          <ChangeEmailForm setNewEmail={setNewEmail} setCurrentPassword={setCurrentPassword} />
        )}
        {currentStep === Steps.FinishStep && <ChangeEmailSuccess />}
      </div>
    </Modal>
  )
}

export default ChangeEmail

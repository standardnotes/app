import { useState } from '@node_modules/preact/hooks';
import {
  ModalDialog,
  ModalDialogButtons,
  ModalDialogDescription,
  ModalDialogLabel
} from '@/components/shared/ModalDialog';
import { Button } from '@/components/Button';
import { FunctionalComponent } from 'preact';
import { WebApplication } from '@/ui_models/application';
import { useBeforeUnload } from '@/hooks/useBeforeUnload';
import { ChangeEmailForm } from './ChangeEmailForm';
import { ChangeEmailSuccess } from './ChangeEmailSuccess';
import { isEmailValid } from '@/utils';
import { ErrorMessages } from '@/enums';

enum SubmitButtonTitles {
  Default = 'Continue',
  GeneratingKeys = 'Generating Keys...',
  Finish = 'Finish'
}

enum Steps {
  InitialStep,
  FinishStep
}

type Props = {
  onCloseDialog: () => void;
  application: WebApplication;
}

export const ChangeEmail: FunctionalComponent<Props> = ({
  onCloseDialog,
  application
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isContinuing, setIsContinuing] = useState(false);
  const [lockContinue, setLockContinue] = useState(false);
  const [submitButtonTitle, setSubmitButtonTitle] = useState(SubmitButtonTitles.Default);
  const [currentStep, setCurrentStep] = useState(Steps.InitialStep);

  useBeforeUnload();

  const {
    CantCloseWithPendingTasks,
    InvalidEmailFormat,
  } = ErrorMessages;

  const applicationAlertService = application.alertService;

  const validateCurrentPassword = async () => {
    if (!currentPassword || currentPassword.length === 0) {
      applicationAlertService.alert(
        'Please enter your current password.'
      );

      return false;
    }

    const success = await application.validateAccountPassword(currentPassword);
    if (!success) {
      applicationAlertService.alert(
        'The current password you entered is not correct. Please try again.'
      );

      return false;
    }

    return success;
  };

  const validateNewEmail = async () => {
    if (!isEmailValid(newEmail)) {
      applicationAlertService.alert(InvalidEmailFormat);

      return false;
    }

    return true;
  };

  const resetProgressState = () => {
    setSubmitButtonTitle(SubmitButtonTitles.Default);
    setIsContinuing(false);
  };

  const processEmailChange = async () => {
    await application.downloadBackup();

    setLockContinue(true);

    const response = await application.changeEmail(
      newEmail,
      currentPassword,
    );

    const success = !response.error;

    setLockContinue(false);

    return success;
  };

  const dismiss = () => {
    if (lockContinue) {
      applicationAlertService.alert(CantCloseWithPendingTasks);
    } else {
      onCloseDialog();
    }
  };

  const handleSubmit = async () => {
    if (lockContinue || isContinuing) {
      return;
    }

    if (currentStep === Steps.FinishStep) {
      dismiss();

      return;
    }

    setIsContinuing(true);
    setSubmitButtonTitle(SubmitButtonTitles.GeneratingKeys);

    const valid = await validateCurrentPassword() && await validateNewEmail();

    if (!valid) {
      resetProgressState();

      return;
    }

    const success = await processEmailChange();
    if (!success) {
      resetProgressState();

      return;
    }

    setIsContinuing(false);
    setSubmitButtonTitle(SubmitButtonTitles.Finish);
    setCurrentStep(Steps.FinishStep);
  };

  const handleDialogClose = () => {
    if (lockContinue) {
      applicationAlertService.alert(CantCloseWithPendingTasks);
    } else {
      onCloseDialog();
    }
  };

  return (
    <div>
      <ModalDialog>
        <ModalDialogLabel closeDialog={handleDialogClose}>
          Change Email
        </ModalDialogLabel>
        <ModalDialogDescription>
          {currentStep === Steps.InitialStep && (
            <ChangeEmailForm
              setNewEmail={setNewEmail}
              setCurrentPassword={setCurrentPassword}
            />
          )}
          {currentStep === Steps.FinishStep && <ChangeEmailSuccess />}
        </ModalDialogDescription>
        <ModalDialogButtons>
          {currentStep === Steps.InitialStep && (
            <Button
              className='min-w-20'
              type='normal'
              label='Cancel'
              onClick={handleDialogClose}
            />
          )}
          <Button
            className='min-w-20'
            type='primary'
            label={submitButtonTitle}
            onClick={handleSubmit}
          />
        </ModalDialogButtons>
      </ModalDialog>
    </div>
  );
};

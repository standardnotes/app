import { useState } from '@node_modules/preact/hooks';
import ModalDialog, {
  ModalDialogButtons,
  ModalDialogDescription,
  ModalDialogLabel
} from '@/components/shared/ModalDialog';
import { Button } from '@/components/Button';
import { FunctionalComponent } from 'preact';
import { WebApplication } from '@/ui_models/application';
import ChangePasswordSuccess from '@/preferences/panes/account/changePassword/ChangePasswordSuccess';
import ChangePasswordForm from '@/preferences/panes/account/changePassword/ChangePasswordForm';
import useBeforeUnload from '@/hooks/useBeforeUnload';

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

const ChangePassword: FunctionalComponent<Props> = ({
  onCloseDialog,
  application
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
  const [isContinuing, setIsContinuing] = useState(false);
  const [lockContinue, setLockContinue] = useState(false);
  const [submitButtonTitle, setSubmitButtonTitle] = useState(SubmitButtonTitles.Default);
  const [currentStep, setCurrentStep] = useState(Steps.InitialStep);

  useBeforeUnload();

  const applicationAlertService = application.alertService;

  const validateCurrentPassword = async () => {
    if (!currentPassword || currentPassword.length === 0) {
      applicationAlertService.alert(
        'Please enter your current password.'
      );
      return false;
    }

    if (!newPassword || newPassword.length === 0) {
      applicationAlertService.alert(
        'Please enter a new password.'
      );
      return false;
    }
    if (newPassword !== newPasswordConfirmation) {
      applicationAlertService.alert(
        'Your new password does not match its confirmation.'
      );
      return false;
    }

    if (!application.getUser()?.email) {
      applicationAlertService.alert(
        'We don\'t have your email stored. Please log out then log back in to fix this issue.'
      );
      return false;
    }

    /** Validate current password */
    const success = await application.validateAccountPassword(currentPassword);
    if (!success) {
      applicationAlertService.alert(
        'The current password you entered is not correct. Please try again.'
      );
    }
    return success;
  };

  const resetProgressState = () => {
    setSubmitButtonTitle(SubmitButtonTitles.Default);
    setIsContinuing(false);
  };

  const processPasswordChange = async () => {
    await application.downloadBackup();

    setLockContinue(true);

    const response = await application.changePassword(
      currentPassword,
      newPassword
    );

    const success = !response.error;

    setLockContinue(false);

    return success;
  };

  const dismiss = () => {
    if (lockContinue) {
      applicationAlertService.alert(
        'Cannot close window until pending tasks are complete.'
      );
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

    const valid = await validateCurrentPassword();

    if (!valid) {
      resetProgressState();
      return;
    }

    const success = await processPasswordChange();
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
      applicationAlertService.alert(
        'Cannot close window until pending tasks are complete.'
      );
    } else {
      onCloseDialog();
    }
  };

  return (
    <div>
      <ModalDialog>
        <ModalDialogLabel closeDialog={handleDialogClose}>
          Change Password
        </ModalDialogLabel>
        <ModalDialogDescription>
          {currentStep === Steps.InitialStep && (
            <ChangePasswordForm
              setCurrentPassword={setCurrentPassword}
              setNewPassword={setNewPassword}
              setNewPasswordConfirmation={setNewPasswordConfirmation}
            />
          )}
          {currentStep === Steps.FinishStep && <ChangePasswordSuccess />}
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

export default ChangePassword;

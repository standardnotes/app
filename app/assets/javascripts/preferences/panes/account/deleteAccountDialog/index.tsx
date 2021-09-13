import { Button } from '@/components/Button';
import { useState } from 'preact/hooks';
import { DeleteAccountForm } from '@/preferences/panes/account/deleteAccountDialog/DeleteAccountForm';
import {
  ModalDialog,
  ModalDialogButtons,
  ModalDialogDescription,
  ModalDialogLabel
} from '@/components/shared/ModalDialog';
import { DeleteAccountSubmitted } from '@/preferences/panes/account/deleteAccountDialog/DeleteAccountSubmitted';
import { executeCallbackWhenEnterIsPressed, isEmailValid } from '@/utils';
import { SNAlertService } from '@node_modules/@standardnotes/snjs';
import { FunctionalComponent } from 'preact';
import { JSXInternal } from '@node_modules/preact/src/jsx';
import TargetedKeyboardEvent = JSXInternal.TargetedKeyboardEvent;
import { ErrorMessages } from '@/enums';

enum SubmitButtonTitles {
  Default = 'Continue',
  Finish = 'Finish'
}

enum Steps {
  InitialStep,
  FinishStep
}

type Props = {
  onCloseDialog: () => void;
  snAlert: SNAlertService['alert']
}

export const DeleteAccountDialog: FunctionalComponent<Props> = ({ onCloseDialog, snAlert }) => {
  const [submitButtonTitle, setSubmitButtonTitle] = useState(SubmitButtonTitles.Default);
  const [currentStep, setCurrentStep] = useState(Steps.InitialStep);
  const [accountEmail, setAccountEmail] = useState('');
  const [isRequestInProgress, setIsRequestInProgress] = useState(false);

  const { EnterEmail, InvalidEmailFormat, SomethingWentWrong } = ErrorMessages;

  const handleKeyPress = (event: TargetedKeyboardEvent<HTMLInputElement>) => {
    executeCallbackWhenEnterIsPressed(event.key, handleSubmit);
  };

  const handleSubmit = async () => {
    if (isRequestInProgress) {
      return;
    }
    if (currentStep === Steps.FinishStep) {
      onCloseDialog();
      return;
    }

    let errorMessage = '';
    const trimmedEmail = accountEmail.trim();

    setAccountEmail(trimmedEmail);

    if (trimmedEmail === '') {
      errorMessage = EnterEmail;
    } else if (!isEmailValid(trimmedEmail)) {
      errorMessage = InvalidEmailFormat;
    }

    if (errorMessage) {
      snAlert(errorMessage);
      return;
    }

    try {
      setIsRequestInProgress(true);

      const res = await fetch(`https://api.standardnotes.com/v1/reset`, {
        method: 'POST',
        body: JSON.stringify({
          email: accountEmail
        })
      });

      const data = await res.json();
      if (!data.error) {
        setCurrentStep(Steps.FinishStep);
        setSubmitButtonTitle(SubmitButtonTitles.Finish);
      }
    } catch {
      snAlert(SomethingWentWrong);
    } finally {
      setIsRequestInProgress(false);
    }
  };

  return (
    <ModalDialog>
      <ModalDialogLabel closeDialog={onCloseDialog}>
        Delete Your Account
      </ModalDialogLabel>
      <ModalDialogDescription>
        {currentStep === Steps.InitialStep && (
          <DeleteAccountForm
            accountEmail={accountEmail}
            setAccountEmail={setAccountEmail}
            handleKeyPress={handleKeyPress}
          />
        )}
        {currentStep === Steps.FinishStep && <DeleteAccountSubmitted />}
      </ModalDialogDescription>
      <ModalDialogButtons>
        {currentStep === Steps.InitialStep && (
          <Button
            className='min-w-20'
            type='normal'
            label='Cancel'
            onClick={onCloseDialog}
          />
        )}
        <Button
          className='min-w-20'
          type='primary'
          label={submitButtonTitle}
          onClick={() => {
            handleSubmit();
          }}
        />
      </ModalDialogButtons>
    </ModalDialog>
  );
};

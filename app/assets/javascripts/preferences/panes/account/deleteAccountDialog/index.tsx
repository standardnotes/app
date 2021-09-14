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
import { executeCallbackWhenEnterIsPressed } from '@/utils';
import { FunctionalComponent } from 'preact';
import { JSXInternal } from '@node_modules/preact/src/jsx';
import TargetedKeyboardEvent = JSXInternal.TargetedKeyboardEvent;
import { ErrorMessages } from '@/enums';
import { WebApplication } from '@/ui_models/application';

enum SubmitButtonTitles {
  Default = 'Delete my account for good',
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

export const DeleteAccountDialog: FunctionalComponent<Props> = ({
  onCloseDialog,
  application,
}) => {
  const [submitButtonTitle, setSubmitButtonTitle] = useState(SubmitButtonTitles.Default);
  const [currentStep, setCurrentStep] = useState(Steps.InitialStep);
  const [password, setPassword] = useState('');
  const [isRequestInProgress, setIsRequestInProgress] = useState(false);

  const { EnterPassword, SomethingWentWrong } = ErrorMessages;
  const { alert: snAlert } = application.alertService;

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

    setIsRequestInProgress(true);

    if (password === '') {
      snAlert(EnterPassword);
      setIsRequestInProgress(false);
      return;
    }

    try {
      const res = await fetch('https://api.standardnotes.com/v1/reset', {
        method: 'DELETE'
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

  const btnClass = currentStep === Steps.InitialStep ? 'bg-dark-red' : '';

  return (
    <ModalDialog className={'width-89'}>
      <ModalDialogLabel closeDialog={onCloseDialog} showSeparator={false} />
      <ModalDialogDescription showSeparator={false}>
        {currentStep === Steps.InitialStep && (
          <DeleteAccountForm
            setPassword={setPassword}
            handleKeyPress={handleKeyPress}
          />
        )}
        {currentStep === Steps.FinishStep && <DeleteAccountSubmitted />}
      </ModalDialogDescription>
      <ModalDialogButtons showSeparator={false}>
        <Button
          className={`min-w-20 ${btnClass}`}
          type='primary'
          isFullWidth={true}
          label={submitButtonTitle}
          onClick={handleSubmit}
          disabled={isRequestInProgress}
        />
      </ModalDialogButtons>
    </ModalDialog>
  );
};

import {
  ModalDialog,
  ModalDialogButtons,
  ModalDialogDescription,
  ModalDialogLabel
} from '@/components/shared/ModalDialog';
import { FunctionalComponent } from 'preact';
import { DecoratedInput } from '@/components/DecoratedInput';
import { Button } from '@/components/Button';
import { useState } from 'preact/hooks';
import { SNAlertService } from '@node_modules/@standardnotes/snjs';
import { HtmlInputTypes } from '@/enums';
import { isEmailValid } from '@/utils';

type Props = {
  onCloseDialog: () => void;
  snAlert: SNAlertService['alert']
};

export const ChangeEmail: FunctionalComponent<Props> = ({ onCloseDialog, snAlert }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    let errorMessage = '';
    if (email.trim() === '' || password.trim() === '') {
      errorMessage = 'Some fields have not been filled out. Please fill out all fields and try again.';
    } else if (!isEmailValid(email)) {
      errorMessage = 'The email you entered has an invalid format. Please review your input and try again.';
    }

    if (errorMessage) {
      snAlert(errorMessage);
      return;
    }
  };

  return (
    <div>
      <ModalDialog>
        <ModalDialogLabel closeDialog={onCloseDialog}>
          Change Email
        </ModalDialogLabel>
        <ModalDialogDescription>
          <div className={'mt-2 mb-3'}>
            <DecoratedInput
              onChange={(newEmail) => {
                setEmail(newEmail);
              }}
              text={email}
              placeholder={'New Email'}
            />
          </div>
          <div className={'mt-2 mb-3'}>
            <DecoratedInput
              type={HtmlInputTypes.Password}
              placeholder={'Password'}
              onChange={password => setPassword(password)}
            />
          </div>
        </ModalDialogDescription>
        <ModalDialogButtons>
          <Button
            className="min-w-20"
            type="normal"
            label="Cancel"
            onClick={onCloseDialog}
          />
          <Button
            className="min-w-20"
            type="primary"
            label="Submit"
            onClick={handleSubmit}
          />
        </ModalDialogButtons>
      </ModalDialog>
    </div>
  );
};

import { DecoratedInput } from '@/components/DecoratedInput';
import { StateUpdater } from 'preact/hooks';
import { FunctionalComponent } from 'preact';

type Props = {
  setCurrentPassword: StateUpdater<string>
  setNewPassword: StateUpdater<string>
  setNewPasswordConfirmation: StateUpdater<string>
}
const ChangePasswordForm: FunctionalComponent<Props> = ({
  setCurrentPassword,
  setNewPassword,
  setNewPasswordConfirmation
}) => {
  return (
    (
      <>
        <div className={'mt-2 mb-3'}>
          <DecoratedInput
            type={'password'}
            onChange={(currentPassword) => {
              setCurrentPassword(currentPassword);
            }}
            placeholder={'Current Password'}
          />
        </div>
        <div className={'mt-2 mb-3'}>
          <DecoratedInput
            type={'password'}
            placeholder={'New Password'}
            onChange={newPassword => setNewPassword(newPassword)}
          />
        </div>
        <div className={'mt-2 mb-3'}>
          <DecoratedInput
            type={'password'}
            placeholder={'Confirm New Password'}
            onChange={newPasswordConfirmation => setNewPasswordConfirmation(newPasswordConfirmation)}
          />
        </div>
      </>
    )
  );
};

export default ChangePasswordForm;

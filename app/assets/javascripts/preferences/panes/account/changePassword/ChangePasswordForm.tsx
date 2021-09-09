import { DecoratedInput } from '@/components/DecoratedInput';
import { StateUpdater } from 'preact/hooks';
import { FunctionalComponent } from 'preact';
import { HtmlInputTypes } from '@/enums';

type Props = {
  setCurrentPassword: StateUpdater<string>
  setNewPassword: StateUpdater<string>
  setNewPasswordConfirmation: StateUpdater<string>
}
export const ChangePasswordForm: FunctionalComponent<Props> = ({
  setCurrentPassword,
  setNewPassword,
  setNewPasswordConfirmation
}) => {
  return (
    (
      <>
        <div className={'mt-2 mb-3'}>
          <DecoratedInput
            type={HtmlInputTypes.Password}
            onChange={(currentPassword) => {
              setCurrentPassword(currentPassword);
            }}
            placeholder={'Current Password'}
          />
        </div>
        <div className={'mt-2 mb-3'}>
          <DecoratedInput
            type={HtmlInputTypes.Password}
            placeholder={'New Password'}
            onChange={newPassword => setNewPassword(newPassword)}
          />
        </div>
        <div className={'mt-2 mb-3'}>
          <DecoratedInput
            type={HtmlInputTypes.Password}
            placeholder={'Confirm New Password'}
            onChange={newPasswordConfirmation => setNewPasswordConfirmation(newPasswordConfirmation)}
          />
        </div>
      </>
    )
  );
};

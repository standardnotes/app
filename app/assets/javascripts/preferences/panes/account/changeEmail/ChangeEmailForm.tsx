import { DecoratedInput } from '@/components/DecoratedInput';
import { StateUpdater } from 'preact/hooks';
import { FunctionalComponent } from 'preact';
import { HtmlInputType } from '@/enums';

type Props = {
  setNewEmail: StateUpdater<string>
  setCurrentPassword: StateUpdater<string>
}
export const ChangeEmailForm: FunctionalComponent<Props> = ({
  setNewEmail,
  setCurrentPassword
}) => {
  return (
    (
      <>
        <div className={'mt-2 mb-3'}>
          <DecoratedInput
            onChange={(newEmail) => {
              setNewEmail(newEmail);
            }}
            placeholder={'New Email'}
          />
        </div>
        <div className={'mt-2 mb-3'}>
          <DecoratedInput
            type={HtmlInputType.Password}
            onChange={(currentPassword) => {
              setCurrentPassword(currentPassword);
            }}
            placeholder={'Current Password'}
          />
        </div>
      </>
    )
  );
};

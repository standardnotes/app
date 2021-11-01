import { StateUpdater } from 'preact/hooks';
import { FunctionalComponent } from 'preact';

type Props = {
  setNewEmail: StateUpdater<string>;
  setCurrentPassword: StateUpdater<string>;
};

const labelClassName = `block mb-1`;

const inputClassName = `w-full p-2 border-1 border-solid border-neutral bg-default rounded-0.5 focus:ring-info focus:outline-none`;

export const ChangeEmailForm: FunctionalComponent<Props> = ({
  setNewEmail,
  setCurrentPassword,
}) => {
  return (
    <div className="w-full flex flex-col">
      <div className="mt-2 mb-3">
        <label className={labelClassName} htmlFor="change-email-email-input">
          New Email:
        </label>
        <input
          id="change-email-email-input"
          className={inputClassName}
          type="email"
          onChange={({ target }) => {
            setNewEmail((target as HTMLInputElement).value);
          }}
        />
      </div>
      <div className="mb-2">
        <label className={labelClassName} htmlFor="change-email-password-input">
          Current Password:
        </label>
        <input
          id="change-email-password-input"
          className={inputClassName}
          type="password"
          onChange={({ target }) => {
            setCurrentPassword((target as HTMLInputElement).value);
          }}
        />
      </div>
    </div>
  );
};

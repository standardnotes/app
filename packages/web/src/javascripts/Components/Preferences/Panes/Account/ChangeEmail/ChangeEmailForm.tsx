import DecoratedInput from '@/Components/Input/DecoratedInput'
import DecoratedPasswordInput from '@/Components/Input/DecoratedPasswordInput'
import { Dispatch, SetStateAction, FunctionComponent } from 'react'

type Props = {
  setNewEmail: Dispatch<SetStateAction<string>>
  setCurrentPassword: Dispatch<SetStateAction<string>>
}

const labelClassName = 'block mb-1'

const ChangeEmailForm: FunctionComponent<Props> = ({ setNewEmail, setCurrentPassword }) => {
  return (
    <div className="flex w-full flex-col">
      <div className="mb-3">
        <label className={labelClassName} htmlFor="change-email-email-input">
          New Email
        </label>
        <DecoratedInput
          type="email"
          id="change-email-email-input"
          onChange={(newEmail) => {
            setNewEmail(newEmail)
          }}
        />
      </div>
      <div className="mb-2">
        <label className={labelClassName} htmlFor="change-email-password-input">
          Current Password
        </label>
        <DecoratedPasswordInput
          id="change-email-password-input"
          type="password"
          onChange={(currentPassword) => {
            setCurrentPassword(currentPassword)
          }}
        />
      </div>
    </div>
  )
}

export default ChangeEmailForm

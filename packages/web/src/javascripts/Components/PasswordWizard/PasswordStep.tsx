import { useState } from 'react'
import DecoratedPasswordInput from '../Input/DecoratedPasswordInput'

export const PasswordStep = ({
  onCurrentPasswordChange,
  onNewPasswordChange,
  onNewPasswordConfirmationChange,
}: {
  onCurrentPasswordChange: (value: string) => void
  onNewPasswordChange: (value: string) => void
  onNewPasswordConfirmationChange: (value: string) => void
}) => {
  const [currentPassword, setCurrentPassword] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState<string>('')

  const handleCurrentPasswordChange = (value: string) => {
    setCurrentPassword(value)
    onCurrentPasswordChange(value)
  }

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value)
    onNewPasswordChange(value)
  }

  const handleNewPasswordConfirmationChange = (value: string) => {
    setNewPasswordConfirmation(value)
    onNewPasswordConfirmationChange(value)
  }

  return (
    <div className="flex flex-col pb-1.5">
      <form>
        <label htmlFor="password-wiz-current-password" className="mb-1 block">
          Current Password
        </label>

        <DecoratedPasswordInput
          autofocus={true}
          id="password-wiz-current-password"
          value={currentPassword}
          onChange={handleCurrentPasswordChange}
          type="password"
        />

        <div className="min-h-2" />

        <label htmlFor="password-wiz-new-password" className="mb-1 block">
          New Password
        </label>

        <DecoratedPasswordInput
          id="password-wiz-new-password"
          value={newPassword}
          onChange={handleNewPasswordChange}
          type="password"
        />

        <div className="min-h-2" />

        <label htmlFor="password-wiz-confirm-new-password" className="mb-1 block">
          Confirm New Password
        </label>

        <DecoratedPasswordInput
          id="password-wiz-confirm-new-password"
          value={newPasswordConfirmation}
          onChange={handleNewPasswordConfirmationChange}
          type="password"
        />
      </form>
    </div>
  )
}

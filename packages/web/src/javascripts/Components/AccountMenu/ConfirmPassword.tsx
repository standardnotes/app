import { STRING_NON_MATCHING_PASSWORDS } from '@/Constants/Strings'
import { WebApplication } from '@/Application/WebApplication'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import {
  FormEventHandler,
  FunctionComponent,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { AccountMenuPane } from './AccountMenuPane'
import Button from '@/Components/Button/Button'
import Checkbox from '@/Components/Checkbox/Checkbox'
import DecoratedPasswordInput from '@/Components/Input/DecoratedPasswordInput'
import Icon from '@/Components/Icon/Icon'
import IconButton from '@/Components/Button/IconButton'

type Props = {
  viewControllerManager: ViewControllerManager
  application: WebApplication
  setMenuPane: (pane: AccountMenuPane) => void
  email: string
  password: string
}

const ConfirmPassword: FunctionComponent<Props> = ({
  application,
  viewControllerManager,
  setMenuPane,
  email,
  password,
}) => {
  const { notesAndTagsCount } = viewControllerManager.accountMenuController
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [isEphemeral, setIsEphemeral] = useState(false)
  const [shouldMergeLocal, setShouldMergeLocal] = useState(true)
  const [error, setError] = useState('')

  const passwordInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    passwordInputRef.current?.focus()
  }, [])

  const handlePasswordChange = useCallback((text: string) => {
    setConfirmPassword(text)
  }, [])

  const handleEphemeralChange = useCallback(() => {
    setIsEphemeral(!isEphemeral)
  }, [isEphemeral])

  const handleShouldMergeChange = useCallback(() => {
    setShouldMergeLocal(!shouldMergeLocal)
  }, [shouldMergeLocal])

  const handleConfirmFormSubmit: FormEventHandler = useCallback(
    (e) => {
      e.preventDefault()

      if (!password) {
        passwordInputRef.current?.focus()
        return
      }

      if (password === confirmPassword) {
        setIsRegistering(true)
        application
          .register(email, password, isEphemeral, shouldMergeLocal)
          .then(() => {
            viewControllerManager.accountMenuController.closeAccountMenu()
            viewControllerManager.accountMenuController.setCurrentPane(AccountMenuPane.GeneralMenu)
          })
          .catch((err) => {
            console.error(err)
            setError(err.message)
          })
          .finally(() => {
            setIsRegistering(false)
          })
      } else {
        setError(STRING_NON_MATCHING_PASSWORDS)
        setConfirmPassword('')
        passwordInputRef.current?.focus()
      }
    },
    [viewControllerManager, application, confirmPassword, email, isEphemeral, password, shouldMergeLocal],
  )

  const handleKeyDown: KeyboardEventHandler = useCallback(
    (e) => {
      if (error.length) {
        setError('')
      }
      if (e.key === 'Enter') {
        handleConfirmFormSubmit(e)
      }
    },
    [handleConfirmFormSubmit, error],
  )

  const handleGoBack = useCallback(() => {
    setMenuPane(AccountMenuPane.Register)
  }, [setMenuPane])

  return (
    <>
      <div className="mt-1 mb-3 flex items-center px-3">
        <IconButton
          icon="arrow-left"
          title="Go back"
          className="mr-2 flex p-0 text-neutral"
          onClick={handleGoBack}
          focusable={true}
          disabled={isRegistering}
        />
        <div className="text-base font-bold">Confirm password</div>
      </div>
      <div className="mb-3 px-3 text-sm">
        Because your notes are encrypted using your password,{' '}
        <span className="text-danger">Standard Notes does not have a password reset option</span>. If you forget your
        password, you will permanently lose access to your data.
      </div>
      <form onSubmit={handleConfirmFormSubmit} className="mb-1 px-3">
        <DecoratedPasswordInput
          className={{ container: 'mb-2' }}
          disabled={isRegistering}
          left={[<Icon type="password" className="text-neutral" />]}
          onChange={handlePasswordChange}
          onKeyDown={handleKeyDown}
          placeholder="Confirm password"
          ref={passwordInputRef}
          value={confirmPassword}
        />
        {error ? <div className="my-2 text-danger">{error}</div> : null}
        <Button
          primary
          fullWidth
          className="mt-1 mb-3"
          label={isRegistering ? 'Creating account...' : 'Create account & sign in'}
          onClick={handleConfirmFormSubmit}
          disabled={isRegistering}
        />
        <Checkbox
          name="is-ephemeral"
          label="Stay signed in"
          checked={!isEphemeral}
          onChange={handleEphemeralChange}
          disabled={isRegistering}
        />
        {notesAndTagsCount > 0 ? (
          <Checkbox
            name="should-merge-local"
            label={`Merge local data (${notesAndTagsCount} notes and tags)`}
            checked={shouldMergeLocal}
            onChange={handleShouldMergeChange}
            disabled={isRegistering}
          />
        ) : null}
      </form>
    </>
  )
}

export default observer(ConfirmPassword)

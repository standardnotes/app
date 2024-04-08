import { STRING_NON_MATCHING_PASSWORDS } from '@/Constants/Strings'
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
import { useApplication } from '../ApplicationProvider'
import { useCaptcha } from '@/Hooks/useCaptcha'
import { isErrorResponse } from '@standardnotes/snjs'

type Props = {
  setMenuPane: (pane: AccountMenuPane) => void
  email: string
  password: string
}

const ConfirmPassword: FunctionComponent<Props> = ({ setMenuPane, email, password }) => {
  const application = useApplication()

  const { notesAndTagsCount } = application.accountMenuController
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [isEphemeral, setIsEphemeral] = useState(false)
  const [shouldMergeLocal, setShouldMergeLocal] = useState(true)
  const [error, setError] = useState('')

  const [hvmToken, setHVMToken] = useState('')
  const [captchaURL, setCaptchaURL] = useState('')

  const register = useCallback(() => {
    setIsRegistering(true)
    application
      .register(email, password, hvmToken, isEphemeral, shouldMergeLocal)
      .then(() => {
        application.accountMenuController.closeAccountMenu()
        application.accountMenuController.setCurrentPane(AccountMenuPane.GeneralMenu)
      })
      .catch((err) => {
        console.error(err)
        setError(err.message)
      })
      .finally(() => {
        setIsRegistering(false)
      })
  }, [application, email, hvmToken, isEphemeral, password, shouldMergeLocal])

  const captchaIframe = useCaptcha(captchaURL, (token) => {
    setHVMToken(token)
    setCaptchaURL('')
  })

  useEffect(() => {
    if (!hvmToken) {
      return
    }

    register()
  }, [hvmToken, register])

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

  const checkIfCaptchaRequiredAndRegister = useCallback(() => {
    application
      .getCaptchaUrl()
      .then((response) => {
        if (isErrorResponse(response)) {
          throw new Error()
        }
        const { captchaUIUrl } = response.data
        if (captchaUIUrl) {
          setCaptchaURL(captchaUIUrl)
        } else {
          setCaptchaURL('')
          register()
        }
      })
      .catch((error) => {
        console.error(error)
        setCaptchaURL('')
        register()
      })
  }, [application, register])

  const handleConfirmFormSubmit: FormEventHandler = useCallback(
    (e) => {
      e.preventDefault()

      if (!password) {
        passwordInputRef.current?.focus()
        return
      }

      if (password !== confirmPassword) {
        setError(STRING_NON_MATCHING_PASSWORDS)
        setConfirmPassword('')
        passwordInputRef.current?.focus()
        return
      }

      checkIfCaptchaRequiredAndRegister()
    },
    [checkIfCaptchaRequiredAndRegister, confirmPassword, password],
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

  const confirmPasswordForm = (
    <>
      <div className="mb-3 px-3 text-sm">
        Because your notes are encrypted using your password,{' '}
        <span className="text-danger">Standard Notes does not have a password reset option</span>. If you forget your
        password, you will permanently lose access to your data.
      </div>
      <form onSubmit={handleConfirmFormSubmit} className="mb-1 px-3">
        {!isRegistering && (
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
        )}
        {error ? <div className="my-2 text-danger">{error}</div> : null}
        <Button
          primary
          fullWidth
          className="mb-3 mt-1"
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

  return (
    <>
      <div className="mb-3 mt-1 flex items-center px-3">
        <IconButton
          icon="arrow-left"
          title="Go back"
          className="mr-2 flex p-0 text-neutral"
          onClick={handleGoBack}
          focusable={true}
          disabled={isRegistering}
        />
        <div className="text-base font-bold">{captchaURL ? 'Human verification' : 'Confirm password'}</div>
      </div>
      {captchaURL ? <div className="p-[10px]">{captchaIframe}</div> : confirmPasswordForm}
    </>
  )
}

export default observer(ConfirmPassword)

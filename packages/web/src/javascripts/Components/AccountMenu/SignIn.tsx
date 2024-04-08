import { isDev } from '@/Utils'
import { observer } from 'mobx-react-lite'
import React, { FunctionComponent, KeyboardEventHandler, useCallback, useEffect, useRef, useState } from 'react'
import { AccountMenuPane } from './AccountMenuPane'
import Button from '@/Components/Button/Button'
import Checkbox from '@/Components/Checkbox/Checkbox'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import DecoratedPasswordInput from '@/Components/Input/DecoratedPasswordInput'
import Icon from '@/Components/Icon/Icon'
import IconButton from '@/Components/Button/IconButton'
import AdvancedOptions from './AdvancedOptions'
import HorizontalSeparator from '../Shared/HorizontalSeparator'
import { getErrorFromErrorResponse, isErrorResponse, getCaptchaHeader } from '@standardnotes/snjs'
import { useApplication } from '../ApplicationProvider'
import { useCaptcha } from '@/Hooks/useCaptcha'

type Props = {
  setMenuPane: (pane: AccountMenuPane) => void
}

const SignInPane: FunctionComponent<Props> = ({ setMenuPane }) => {
  const application = useApplication()

  const { notesAndTagsCount } = application.accountMenuController
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState('')
  const [error, setError] = useState('')
  const [isEphemeral, setIsEphemeral] = useState(false)

  const [isStrictSignin, setIsStrictSignin] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [shouldMergeLocal, setShouldMergeLocal] = useState(true)
  const [isPrivateUsername, setIsPrivateUsername] = useState(false)

  const [isRecoverySignIn, setIsRecoverySignIn] = useState(false)

  const [captchaURL, setCaptchaURL] = useState('')
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [hvmToken, setHVMToken] = useState('')
  const captchaIframe = useCaptcha(captchaURL, (token) => {
    setHVMToken(token)
    setShowCaptcha(false)
    setCaptchaURL('')
  })

  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (emailInputRef?.current) {
      emailInputRef.current?.focus()
    }
    if (isDev && window.devAccountEmail) {
      setEmail(window.devAccountEmail)
      setPassword(window.devAccountPassword as string)
    }
  }, [])

  const resetInvalid = useCallback(() => {
    if (error.length) {
      setError('')
    }
  }, [setError, error])

  const handleEmailChange = useCallback((text: string) => {
    setEmail(text)
  }, [])

  const handlePasswordChange = useCallback(
    (text: string) => {
      if (error.length) {
        setError('')
      }
      setPassword(text)
    },
    [setPassword, error],
  )

  const handleEphemeralChange = useCallback(() => {
    setIsEphemeral(!isEphemeral)
  }, [isEphemeral])

  const handleStrictSigninChange = useCallback(() => {
    setIsStrictSignin(!isStrictSignin)
  }, [isStrictSignin])

  const onRecoveryCodesChange = useCallback(
    (newIsRecoverySignIn: boolean, recoveryCodes?: string) => {
      setIsRecoverySignIn(newIsRecoverySignIn)
      if (newIsRecoverySignIn && recoveryCodes) {
        setRecoveryCodes(recoveryCodes)
      }
    },
    [setRecoveryCodes],
  )

  const handleShouldMergeChange = useCallback(() => {
    setShouldMergeLocal(!shouldMergeLocal)
  }, [shouldMergeLocal])

  const signIn = useCallback(() => {
    setIsSigningIn(true)
    emailInputRef?.current?.blur()
    passwordInputRef?.current?.blur()

    application
      .signIn(email, password, isStrictSignin, isEphemeral, shouldMergeLocal, false, hvmToken)
      .then((response) => {
        const captchaURL = getCaptchaHeader(response)
        if (captchaURL) {
          setCaptchaURL(captchaURL)
        }
        if (isErrorResponse(response)) {
          throw new Error(getErrorFromErrorResponse(response).message)
        }
        application.accountMenuController.closeAccountMenu()
      })
      .catch((err) => {
        console.error(err)
        setError(err.message ?? err.toString())
        setPassword('')
        setHVMToken('')
        passwordInputRef?.current?.blur()
      })
      .finally(() => {
        setIsSigningIn(false)
      })
  }, [application, email, hvmToken, isEphemeral, isStrictSignin, password, shouldMergeLocal])

  const recoverySignIn = useCallback(() => {
    setIsSigningIn(true)
    emailInputRef?.current?.blur()
    passwordInputRef?.current?.blur()

    application.signInWithRecoveryCodes
      .execute({
        recoveryCodes,
        username: email,
        password: password,
        hvmToken,
      })
      .then((result) => {
        if (result.isFailed()) {
          const error = result.getError()
          try {
            const parsed = JSON.parse(error)
            if (parsed.captchaURL) {
              setCaptchaURL(parsed.captchaURL)
              return
            }
          } catch (e) {
            setCaptchaURL('')
          }
          throw new Error(error)
        }
        application.accountMenuController.closeAccountMenu()
      })
      .catch((err) => {
        console.error(err)
        setError(err.message ?? err.toString())
        setPassword('')
        setHVMToken('')
        passwordInputRef?.current?.blur()
      })
      .finally(() => {
        setIsSigningIn(false)
      })
  }, [application.accountMenuController, application.signInWithRecoveryCodes, email, hvmToken, password, recoveryCodes])

  const onPrivateUsernameChange = useCallback(
    (newisPrivateUsername: boolean, privateUsernameIdentifier?: string) => {
      setIsPrivateUsername(newisPrivateUsername)
      if (newisPrivateUsername && privateUsernameIdentifier) {
        setEmail(privateUsernameIdentifier)
      }
    },
    [setEmail],
  )

  const performSignIn = useCallback(() => {
    if (!email || email.length === 0) {
      emailInputRef?.current?.focus()
      return
    }

    if (!password || password.length === 0) {
      passwordInputRef?.current?.focus()
      return
    }

    if (isRecoverySignIn) {
      recoverySignIn()
      return
    }

    signIn()
  }, [email, isRecoverySignIn, password, recoverySignIn, signIn])

  const handleSignInFormSubmit = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault()

      if (captchaURL) {
        setShowCaptcha(true)
        return
      }

      performSignIn()
    },
    [captchaURL, performSignIn],
  )

  const handleKeyDown: KeyboardEventHandler = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        handleSignInFormSubmit(e)
      }
    },
    [handleSignInFormSubmit],
  )

  useEffect(() => {
    if (!hvmToken) {
      return
    }

    performSignIn()
  }, [hvmToken, performSignIn])

  const signInForm = (
    <>
      <div className="mb-1 px-3">
        <DecoratedInput
          className={{ container: `mb-2 ${error ? 'border-danger' : null}` }}
          left={[<Icon type="email" className="text-neutral" />]}
          type="email"
          placeholder="Email"
          value={email}
          onChange={handleEmailChange}
          onFocus={resetInvalid}
          onKeyDown={handleKeyDown}
          disabled={isSigningIn || isPrivateUsername}
          ref={emailInputRef}
          spellcheck={false}
        />
        <DecoratedPasswordInput
          className={{ container: `mb-2 ${error ? 'border-danger' : null}` }}
          disabled={isSigningIn}
          left={[<Icon type="password" className="text-neutral" />]}
          onChange={handlePasswordChange}
          onFocus={resetInvalid}
          onKeyDown={handleKeyDown}
          placeholder="Password"
          ref={passwordInputRef}
          value={password}
        />
        {error ? <div className="my-2 text-danger">{error}</div> : null}
        <Button
          className="mb-3 mt-1"
          label={isSigningIn ? 'Signing in...' : 'Sign in'}
          primary
          onClick={handleSignInFormSubmit}
          disabled={isSigningIn}
          fullWidth={true}
        />
        <Checkbox
          name="is-ephemeral"
          label="Stay signed in"
          checked={!isEphemeral}
          disabled={isSigningIn || isRecoverySignIn}
          onChange={handleEphemeralChange}
        />
        {notesAndTagsCount > 0 ? (
          <Checkbox
            name="should-merge-local"
            label={`Merge local data (${notesAndTagsCount} notes and tags)`}
            checked={shouldMergeLocal}
            disabled={isSigningIn}
            onChange={handleShouldMergeChange}
          />
        ) : null}
      </div>
      <HorizontalSeparator classes="my-2" />
      <AdvancedOptions
        disabled={isSigningIn}
        onPrivateUsernameModeChange={onPrivateUsernameChange}
        onStrictSignInChange={handleStrictSigninChange}
        onRecoveryCodesChange={onRecoveryCodesChange}
      />
    </>
  )

  return (
    <>
      <div className="mb-3 mt-1 flex items-center px-3">
        <IconButton
          icon="arrow-left"
          title="Go back"
          className="mr-2 flex p-0 text-neutral"
          onClick={() => setMenuPane(AccountMenuPane.GeneralMenu)}
          focusable={true}
          disabled={isSigningIn}
        />
        <div className="text-base font-bold">{showCaptcha ? 'Human verification' : 'Sign in'}</div>
      </div>
      {showCaptcha ? <div className="p-[10px]">{captchaIframe}</div> : signInForm}
    </>
  )
}

export default observer(SignInPane)

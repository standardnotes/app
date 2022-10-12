import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
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

type Props = {
  viewControllerManager: ViewControllerManager
  application: WebApplication
  setMenuPane: (pane: AccountMenuPane) => void
}

const SignInPane: FunctionComponent<Props> = ({ application, viewControllerManager, setMenuPane }) => {
  const { notesAndTagsCount } = viewControllerManager.accountMenuController
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isEphemeral, setIsEphemeral] = useState(false)

  const [isStrictSignin, setIsStrictSignin] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [shouldMergeLocal, setShouldMergeLocal] = useState(true)
  const [isPrivateUsername, setIsPrivateUsername] = useState(false)

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

  const handleShouldMergeChange = useCallback(() => {
    setShouldMergeLocal(!shouldMergeLocal)
  }, [shouldMergeLocal])

  const signIn = useCallback(() => {
    setIsSigningIn(true)
    emailInputRef?.current?.blur()
    passwordInputRef?.current?.blur()

    application
      .signIn(email, password, isStrictSignin, isEphemeral, shouldMergeLocal)
      .then((res) => {
        if (res.error) {
          throw new Error(res.error.message)
        }
        viewControllerManager.accountMenuController.closeAccountMenu()
      })
      .catch((err) => {
        console.error(err)
        setError(err.message ?? err.toString())
        setPassword('')
        passwordInputRef?.current?.blur()
      })
      .finally(() => {
        setIsSigningIn(false)
      })
  }, [viewControllerManager, application, email, isEphemeral, isStrictSignin, password, shouldMergeLocal])

  const onPrivateUsernameChange = useCallback(
    (newisPrivateUsername: boolean, privateUsernameIdentifier?: string) => {
      setIsPrivateUsername(newisPrivateUsername)
      if (newisPrivateUsername && privateUsernameIdentifier) {
        setEmail(privateUsernameIdentifier)
      }
    },
    [setEmail],
  )

  const handleSignInFormSubmit = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault()

      if (!email || email.length === 0) {
        emailInputRef?.current?.focus()
        return
      }

      if (!password || password.length === 0) {
        passwordInputRef?.current?.focus()
        return
      }

      signIn()
    },
    [email, password, signIn],
  )

  const handleKeyDown: KeyboardEventHandler = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        handleSignInFormSubmit(e)
      }
    },
    [handleSignInFormSubmit],
  )

  return (
    <>
      <div className="mt-1 mb-3 flex items-center px-3">
        <IconButton
          icon="arrow-left"
          title="Go back"
          className="mr-2 flex p-0 text-neutral"
          onClick={() => setMenuPane(AccountMenuPane.GeneralMenu)}
          focusable={true}
          disabled={isSigningIn}
        />
        <div className="text-base font-bold">Sign in</div>
      </div>
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
          className="mt-1 mb-3"
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
          disabled={isSigningIn}
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
        viewControllerManager={viewControllerManager}
        application={application}
        disabled={isSigningIn}
        onPrivateUsernameModeChange={onPrivateUsernameChange}
        onStrictSignInChange={handleStrictSigninChange}
      />
    </>
  )
}

export default observer(SignInPane)

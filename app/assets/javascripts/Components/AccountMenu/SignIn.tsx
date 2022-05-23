import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'
import { isDev } from '@/Utils'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'preact'
import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { AccountMenuPane } from './AccountMenuPane'
import { Button } from '@/Components/Button/Button'
import { Checkbox } from '@/Components/Checkbox/Checkbox'
import { DecoratedInput } from '@/Components/Input/DecoratedInput'
import { DecoratedPasswordInput } from '@/Components/Input/DecoratedPasswordInput'
import { Icon } from '@/Components/Icon/Icon'
import { IconButton } from '@/Components/Button/IconButton'
import { AdvancedOptions } from './AdvancedOptions'

type Props = {
  appState: AppState
  application: WebApplication
  setMenuPane: (pane: AccountMenuPane) => void
}

export const SignInPane: FunctionComponent<Props> = observer(({ application, appState, setMenuPane }) => {
  const { notesAndTagsCount } = appState.accountMenu
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isEphemeral, setIsEphemeral] = useState(false)

  const [isStrictSignin, setIsStrictSignin] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [shouldMergeLocal, setShouldMergeLocal] = useState(true)
  const [isPrivateWorkspace, setIsPrivateWorkspace] = useState(false)

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
        appState.accountMenu.closeAccountMenu()
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
  }, [appState, application, email, isEphemeral, isStrictSignin, password, shouldMergeLocal])

  const onPrivateWorkspaceChange = useCallback(
    (newIsPrivateWorkspace: boolean, privateWorkspaceIdentifier?: string) => {
      setIsPrivateWorkspace(newIsPrivateWorkspace)
      if (newIsPrivateWorkspace && privateWorkspaceIdentifier) {
        setEmail(privateWorkspaceIdentifier)
      }
    },
    [setEmail],
  )

  const handleSignInFormSubmit = useCallback(
    (e: Event) => {
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

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSignInFormSubmit(e)
      }
    },
    [handleSignInFormSubmit],
  )

  return (
    <>
      <div className="flex items-center px-3 mt-1 mb-3">
        <IconButton
          icon="arrow-left"
          title="Go back"
          className="flex mr-2 color-neutral p-0"
          onClick={() => setMenuPane(AccountMenuPane.GeneralMenu)}
          focusable={true}
          disabled={isSigningIn}
        />
        <div className="sn-account-menu-headline">Sign in</div>
      </div>
      <div className="px-3 mb-1">
        <DecoratedInput
          className={`mb-2 ${error ? 'border-dark-red' : null}`}
          left={[<Icon type="email" className="color-neutral" />]}
          type="email"
          placeholder="Email"
          value={email}
          onChange={handleEmailChange}
          onFocus={resetInvalid}
          onKeyDown={handleKeyDown}
          disabled={isSigningIn || isPrivateWorkspace}
          ref={emailInputRef}
        />
        <DecoratedPasswordInput
          className={`mb-2 ${error ? 'border-dark-red' : null}`}
          disabled={isSigningIn}
          left={[<Icon type="password" className="color-neutral" />]}
          onChange={handlePasswordChange}
          onFocus={resetInvalid}
          onKeyDown={handleKeyDown}
          placeholder="Password"
          ref={passwordInputRef}
          value={password}
        />
        {error ? <div className="color-dark-red my-2">{error}</div> : null}
        <Button
          className="btn-w-full mt-1 mb-3"
          label={isSigningIn ? 'Signing in...' : 'Sign in'}
          variant="primary"
          onClick={handleSignInFormSubmit}
          disabled={isSigningIn}
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
      <div className="h-1px my-2 bg-border"></div>
      <AdvancedOptions
        appState={appState}
        application={application}
        disabled={isSigningIn}
        onPrivateWorkspaceChange={onPrivateWorkspaceChange}
        onStrictSignInChange={handleStrictSigninChange}
      />
    </>
  )
})

import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, KeyboardEventHandler, useCallback, useEffect, useRef, useState } from 'react'
import { AccountMenuPane } from './AccountMenuPane'
import Button from '@/Components/Button/Button'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import DecoratedPasswordInput from '@/Components/Input/DecoratedPasswordInput'
import Icon from '@/Components/Icon/Icon'
import IconButton from '@/Components/Button/IconButton'
import AdvancedOptions from './AdvancedOptions'

type Props = {
  viewControllerManager: ViewControllerManager
  application: WebApplication
  setMenuPane: (pane: AccountMenuPane) => void
  email: string
  setEmail: React.Dispatch<React.SetStateAction<string>>
  password: string
  setPassword: React.Dispatch<React.SetStateAction<string>>
}

const CreateAccount: FunctionComponent<Props> = ({
  viewControllerManager,
  application,
  setMenuPane,
  email,
  setEmail,
  password,
  setPassword,
}) => {
  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const [isPrivateWorkspace, setIsPrivateWorkspace] = useState(false)

  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current?.focus()
    }
  }, [])

  const handleEmailChange = useCallback(
    (text: string) => {
      setEmail(text)
    },
    [setEmail],
  )

  const handlePasswordChange = useCallback(
    (text: string) => {
      setPassword(text)
    },
    [setPassword],
  )

  const handleRegisterFormSubmit = useCallback(
    (e) => {
      e.preventDefault()

      if (!email || email.length === 0) {
        emailInputRef.current?.focus()
        return
      }

      if (!password || password.length === 0) {
        passwordInputRef.current?.focus()
        return
      }

      setEmail(email)
      setPassword(password)
      setMenuPane(AccountMenuPane.ConfirmPassword)
    },
    [email, password, setPassword, setMenuPane, setEmail],
  )

  const handleKeyDown: KeyboardEventHandler = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        handleRegisterFormSubmit(e)
      }
    },
    [handleRegisterFormSubmit],
  )

  const handleClose = useCallback(() => {
    setMenuPane(AccountMenuPane.GeneralMenu)
    setEmail('')
    setPassword('')
  }, [setEmail, setMenuPane, setPassword])

  const onPrivateWorkspaceChange = useCallback(
    (isPrivateWorkspace: boolean, privateWorkspaceIdentifier?: string) => {
      setIsPrivateWorkspace(isPrivateWorkspace)
      if (isPrivateWorkspace && privateWorkspaceIdentifier) {
        setEmail(privateWorkspaceIdentifier)
      }
    },
    [setEmail],
  )

  return (
    <>
      <div className="flex items-center px-3 mt-1 mb-3">
        <IconButton
          icon="arrow-left"
          title="Go back"
          className="flex mr-2 text-neutral p-0"
          onClick={handleClose}
          focusable={true}
        />
        <div className="font-bold text-base">Create account</div>
      </div>
      <form onSubmit={handleRegisterFormSubmit} className="px-3 mb-1">
        <DecoratedInput
          className="mb-2"
          disabled={isPrivateWorkspace}
          left={[<Icon type="email" className="text-neutral" />]}
          onChange={handleEmailChange}
          onKeyDown={handleKeyDown}
          placeholder="Email"
          ref={emailInputRef}
          type="email"
          value={email}
        />
        <DecoratedPasswordInput
          className="mb-2"
          left={[<Icon type="password" className="text-neutral" />]}
          onChange={handlePasswordChange}
          onKeyDown={handleKeyDown}
          placeholder="Password"
          ref={passwordInputRef}
          value={password}
        />
        <Button className="w-full mt-1" label="Next" variant="primary" onClick={handleRegisterFormSubmit} />
      </form>
      <div className="h-1px my-2 bg-border"></div>
      <AdvancedOptions
        application={application}
        viewControllerManager={viewControllerManager}
        onPrivateWorkspaceChange={onPrivateWorkspaceChange}
      />
    </>
  )
}

export default observer(CreateAccount)

import Button from '@/Components/Button/Button'
import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { PurchaseFlowPane } from '@/Controllers/PurchaseFlow/PurchaseFlowPane'
import { observer } from 'mobx-react-lite'
import { ChangeEventHandler, FunctionComponent, useEffect, useRef, useState } from 'react'
import FloatingLabelInput from '@/Components/Input/FloatingLabelInput'
import { isEmailValid } from '@/Utils'
import { BlueDotIcon, CircleIcon, DiamondIcon, CreateAccountIllustration } from '@standardnotes/icons'
import { loadPurchaseFlowUrl } from '../PurchaseFlowFunctions'

type Props = {
  viewControllerManager: ViewControllerManager
  application: WebApplication
}

const CreateAccount: FunctionComponent<Props> = ({ viewControllerManager, application }) => {
  const { setCurrentPane } = viewControllerManager.purchaseFlowController
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [isEmailInvalid, setIsEmailInvalid] = useState(false)
  const [isPasswordNotMatching, setIsPasswordNotMatching] = useState(false)

  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current?.focus()
    }
  }, [])

  const handleEmailChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setEmail(e.target.value)
    setIsEmailInvalid(false)
  }

  const handlePasswordChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setPassword(e.target.value)
  }

  const handleConfirmPasswordChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setConfirmPassword(e.target.value)
    setIsPasswordNotMatching(false)
  }

  const handleSignInInstead = () => {
    setCurrentPane(PurchaseFlowPane.SignIn)
  }

  const subscribeWithoutAccount = () => {
    loadPurchaseFlowUrl(application).catch((err) => {
      console.error(err)
      application.alertService.alert(err).catch(console.error)
    })
  }

  const handleCreateAccount = async () => {
    if (!email) {
      emailInputRef?.current?.focus()
      return
    }

    if (!isEmailValid(email)) {
      setIsEmailInvalid(true)
      emailInputRef?.current?.focus()
      return
    }

    if (!password) {
      passwordInputRef?.current?.focus()
      return
    }

    if (!confirmPassword) {
      confirmPasswordInputRef?.current?.focus()
      return
    }

    if (password !== confirmPassword) {
      setConfirmPassword('')
      setIsPasswordNotMatching(true)
      confirmPasswordInputRef?.current?.focus()
      return
    }

    setIsCreatingAccount(true)

    try {
      await application.register(email, password)
      loadPurchaseFlowUrl(application).catch((err) => {
        console.error(err)
        application.alertService.alert(err).catch(console.error)
      })
    } catch (err) {
      console.error(err)
      application.alertService.alert(err as string).catch(console.error)
    } finally {
      setIsCreatingAccount(false)
    }
  }

  return (
    <div className="flex items-center">
      <CircleIcon className="absolute top-[40%] -left-28 h-8 w-8" />
      <BlueDotIcon className="absolute top-[35%] -left-10 h-4 w-4" />
      <DiamondIcon className="absolute -bottom-5 left-0 -z-[1] h-26 w-26 -translate-x-1/2" />

      <CircleIcon className="absolute bottom-[35%] -right-20 h-8 w-8" />
      <BlueDotIcon className="absolute bottom-[25%] -right-10 h-4 w-4" />
      <DiamondIcon className="absolute top-0 -right-2 -z-[1] h-18 w-18 translate-x-1/2" />

      <div className="mr-0 md:mr-12">
        <h1 className="mt-0 mb-2 text-2xl font-bold">Create your free account</h1>
        <div className="mb-4 text-sm font-medium">to continue to Standard Notes.</div>
        <form onSubmit={handleCreateAccount}>
          <div className="flex flex-col">
            <FloatingLabelInput
              className={`min-w-auto md:min-w-90 ${isEmailInvalid ? 'mb-2' : 'mb-4'}`}
              id="purchase-sign-in-email"
              type="email"
              label="Email"
              value={email}
              onChange={handleEmailChange}
              ref={emailInputRef}
              disabled={isCreatingAccount}
              isInvalid={isEmailInvalid}
            />
            {isEmailInvalid ? <div className="mb-4 text-danger">Please provide a valid email.</div> : null}
            <FloatingLabelInput
              className="min-w-auto mb-4 md:min-w-90"
              id="purchase-create-account-password"
              type="password"
              label="Password"
              value={password}
              onChange={handlePasswordChange}
              ref={passwordInputRef}
              disabled={isCreatingAccount}
            />
            <FloatingLabelInput
              className={`min-w-auto md:min-w-90 ${isPasswordNotMatching ? 'mb-2' : 'mb-4'}`}
              id="create-account-confirm"
              type="password"
              label="Repeat password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              ref={confirmPasswordInputRef}
              disabled={isCreatingAccount}
              isInvalid={isPasswordNotMatching}
            />
            {isPasswordNotMatching ? (
              <div className="mb-4 text-danger">Passwords don't match. Please try again.</div>
            ) : null}
          </div>
        </form>
        <div className="flex flex-col-reverse items-start justify-between md:flex-row md:items-center">
          <div className="flex flex-col">
            <button
              onClick={handleSignInInstead}
              disabled={isCreatingAccount}
              className="mb-2 flex cursor-pointer items-start border-0 bg-default p-0 font-medium text-info hover:underline"
            >
              Sign in instead
            </button>
            <button
              onClick={subscribeWithoutAccount}
              disabled={isCreatingAccount}
              className="flex cursor-pointer items-start border-0 bg-default p-0 font-medium text-info hover:underline"
            >
              Subscribe without account
            </button>
          </div>
          <Button
            className="mb-4 py-2.5 md:mb-0"
            primary
            label={isCreatingAccount ? 'Creating account...' : 'Create account'}
            onClick={handleCreateAccount}
            disabled={isCreatingAccount}
          />
        </div>
      </div>
      <CreateAccountIllustration className="hidden md:block" />
    </div>
  )
}

export default observer(CreateAccount)

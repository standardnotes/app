import Button from '@/Components/Button/Button'
import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { PurchaseFlowPane } from '@/Controllers/PurchaseFlow/PurchaseFlowPane'
import { observer } from 'mobx-react-lite'
import { ChangeEventHandler, FunctionComponent, useEffect, useRef, useState } from 'react'
import FloatingLabelInput from '@/Components/Input/FloatingLabelInput'
import { isEmailValid } from '@/Utils'
import { BlueDotIcon, CircleIcon, DiamondIcon } from '@standardnotes/icons'
import { loadPurchaseFlowUrl } from '../PurchaseFlowFunctions'

type Props = {
  viewControllerManager: ViewControllerManager
  application: WebApplication
}

const SignIn: FunctionComponent<Props> = ({ viewControllerManager, application }) => {
  const { setCurrentPane } = viewControllerManager.purchaseFlowController
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isEmailInvalid, setIsEmailInvalid] = useState(false)
  const [isPasswordInvalid, setIsPasswordInvalid] = useState(false)
  const [otherErrorMessage, setOtherErrorMessage] = useState('')

  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)

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
    setIsPasswordInvalid(false)
    setOtherErrorMessage('')
  }

  const handleCreateAccountInstead = () => {
    if (isSigningIn) {
      return
    }
    setCurrentPane(PurchaseFlowPane.CreateAccount)
  }

  const handleSignIn = async () => {
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

    setIsSigningIn(true)

    try {
      const response = await application.signIn(email, password)
      if (response.error || response.data?.error) {
        throw new Error(response.error?.message || response.data?.error?.message)
      } else {
        viewControllerManager.purchaseFlowController.closePurchaseFlow()

        if (!application.hideSubscriptionMarketing) {
          loadPurchaseFlowUrl(application).catch((err) => {
            console.error(err)
            application.alertService.alert(err).catch(console.error)
          })
        }
      }
    } catch (err) {
      console.error(err)
      if ((err as Error).toString().includes('Invalid email or password')) {
        setIsSigningIn(false)
        setIsEmailInvalid(true)
        setIsPasswordInvalid(true)
        setOtherErrorMessage('Invalid email or password.')
        setPassword('')
      } else {
        application.alertService.alert(err as string).catch(console.error)
      }
    }
  }

  return (
    <div className="flex items-center">
      <CircleIcon className="absolute top-[35%] -left-56 h-8 w-8" />
      <BlueDotIcon className="absolute top-[30%] -left-40 h-4 w-4" />
      <DiamondIcon className="absolute -bottom-5 left-0 -z-[1] h-26 w-26 -translate-x-1/2" />

      <CircleIcon className="absolute bottom-[30%] -right-56 h-8 w-8" />
      <BlueDotIcon className="absolute bottom-[20%] -right-44 h-4 w-4" />
      <DiamondIcon className="absolute top-0 -right-2 -z-[1] h-18 w-18 translate-x-1/2" />

      <div>
        <h1 className="mt-0 mb-2 text-2xl font-bold">Sign in</h1>
        <div className="mb-4 text-sm font-medium">to continue to Standard Notes.</div>
        <form onSubmit={handleSignIn}>
          <div className="flex flex-col">
            <FloatingLabelInput
              className={`min-w-auto sm:min-w-90 ${isEmailInvalid && !otherErrorMessage ? 'mb-2' : 'mb-4'}`}
              id="purchase-sign-in-email"
              type="email"
              label="Email"
              value={email}
              onChange={handleEmailChange}
              ref={emailInputRef}
              disabled={isSigningIn}
              isInvalid={isEmailInvalid}
            />
            {isEmailInvalid && !otherErrorMessage ? (
              <div className="mb-4 text-danger">Please provide a valid email.</div>
            ) : null}
            <FloatingLabelInput
              className={`min-w-auto sm:min-w-90 ${otherErrorMessage ? 'mb-2' : 'mb-4'}`}
              id="purchase-sign-in-password"
              type="password"
              label="Password"
              value={password}
              onChange={handlePasswordChange}
              ref={passwordInputRef}
              disabled={isSigningIn}
              isInvalid={isPasswordInvalid}
            />
            {otherErrorMessage ? <div className="mb-4 text-danger">{otherErrorMessage}</div> : null}
          </div>
          <Button
            className={`${isSigningIn ? 'min-w-30' : 'min-w-24'} mb-5 py-2.5`}
            primary
            label={isSigningIn ? 'Signing in...' : 'Sign in'}
            onClick={handleSignIn}
            disabled={isSigningIn}
          />
        </form>
        <div className="text-sm font-medium text-passive-1">
          Don’t have an account yet?{' '}
          <a
            className={`text-info ${isSigningIn ? 'cursor-not-allowed' : 'cursor-pointer '}`}
            onClick={handleCreateAccountInstead}
          >
            Create account
          </a>
        </div>
      </div>
    </div>
  )
}

export default observer(SignIn)

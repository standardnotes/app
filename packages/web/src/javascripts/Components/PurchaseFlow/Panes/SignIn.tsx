import Button from '@/Components/Button/Button'
import { WebApplication } from '@/Application/WebApplication'
import { PurchaseFlowPane } from '@/Controllers/PurchaseFlow/PurchaseFlowPane'
import { observer } from 'mobx-react-lite'
import { ChangeEventHandler, FunctionComponent, useEffect, useRef, useState } from 'react'
import FloatingLabelInput from '@/Components/Input/FloatingLabelInput'
import { isEmailValid } from '@/Utils'
import { BlueDotIcon, CircleIcon, DiamondIcon } from '@standardnotes/icons'
import { isErrorResponse, getCaptchaHeader } from '@standardnotes/snjs'
import { useCaptcha } from '@/Hooks/useCaptcha'

type Props = {
  application: WebApplication
}

const SignIn: FunctionComponent<Props> = ({ application }) => {
  const { setCurrentPane } = application.purchaseFlowController
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isEmailInvalid, setIsEmailInvalid] = useState(false)
  const [isPasswordInvalid, setIsPasswordInvalid] = useState(false)
  const [otherErrorMessage, setOtherErrorMessage] = useState('')

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

    if (captchaURL) {
      setShowCaptcha(true)
      return
    }

    setIsSigningIn(true)

    try {
      const response = await application.signIn(email, password, undefined, undefined, undefined, undefined, hvmToken)
      const captchaURL = getCaptchaHeader(response)
      if (captchaURL) {
        setCaptchaURL(captchaURL)
        return
      } else {
        setCaptchaURL('')
      }
      if (isErrorResponse(response)) {
        throw new Error(response.data.error?.message)
      } else {
        application.purchaseFlowController.closePurchaseFlow()
        void application.purchaseFlowController.openPurchaseFlow()
      }
    } catch (err) {
      console.error(err)
      if ((err as Error).toString().includes('Invalid email or password')) {
        setIsEmailInvalid(true)
        setIsPasswordInvalid(true)
        setOtherErrorMessage('Invalid email or password.')
        setPassword('')
      } else {
        application.alerts.alert(err as string).catch(console.error)
      }
    } finally {
      setIsSigningIn(false)
    }
  }

  const signInForm = (
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
  )

  return (
    <div className="flex items-center">
      <CircleIcon className="absolute -left-56 top-[35%] h-8 w-8" />
      <BlueDotIcon className="absolute -left-40 top-[30%] h-4 w-4" />
      <DiamondIcon className="absolute -bottom-5 left-0 -z-[1] h-26 w-26 -translate-x-1/2" />

      <CircleIcon className="absolute -right-56 bottom-[30%] h-8 w-8" />
      <BlueDotIcon className="absolute -right-44 bottom-[20%] h-4 w-4" />
      <DiamondIcon className="absolute -right-2 top-0 -z-[1] h-18 w-18 translate-x-1/2" />

      <div>
        <h1 className="mb-2 mt-0 text-2xl font-bold">Sign in</h1>
        <div className="mb-4 text-sm font-medium">to continue to Standard Notes.</div>
        {showCaptcha ? captchaIframe : signInForm}
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

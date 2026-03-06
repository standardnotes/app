import Button from '@/Components/Button/Button'
import { WebApplication } from '@/Application/WebApplication'
import { PurchaseFlowPane } from '@/Controllers/PurchaseFlow/PurchaseFlowPane'
import { observer } from 'mobx-react-lite'
import { ChangeEventHandler, FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import FloatingLabelInput from '@/Components/Input/FloatingLabelInput'
import { isEmailValid } from '@/Utils'
import { BlueDotIcon, CircleIcon, DiamondIcon, CreateAccountIllustration } from '@standardnotes/icons'
import { useCaptcha } from '@/Hooks/useCaptcha'
import { AccountMenuPane } from '../../AccountMenu/AccountMenuPane'
import { isErrorResponse } from '@standardnotes/snjs'
import { c } from 'ttag'

type Props = {
  application: WebApplication
}

const CreateAccount: FunctionComponent<Props> = ({ application }) => {
  const { setCurrentPane } = application.purchaseFlowController
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [isEmailInvalid, setIsEmailInvalid] = useState(false)
  const [isPasswordNotMatching, setIsPasswordNotMatching] = useState(false)

  const [hvmToken, setHVMToken] = useState('')
  const [captchaURL, setCaptchaURL] = useState('')

  const register = useCallback(() => {
    setIsCreatingAccount(true)
    application
      .register(email, password, hvmToken)
      .then(() => {
        application.accountMenuController.closeAccountMenu()
        application.accountMenuController.setCurrentPane(AccountMenuPane.GeneralMenu)
        application.purchaseFlowController.closePurchaseFlow()
      })
      .catch((err) => {
        console.error(err)
        application.alerts.alert(err as string).catch(console.error)
      })
      .finally(() => {
        setIsCreatingAccount(false)
      })
  }, [application, email, hvmToken, password])

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
    void application.purchaseFlowController.openPurchaseWebpage()
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

    checkIfCaptchaRequiredAndRegister()
  }

  const CreateAccountForm = (
    <form onSubmit={handleCreateAccount}>
      <div className="flex flex-col">
        <FloatingLabelInput
          className={`min-w-auto md:min-w-90 ${isEmailInvalid ? 'mb-2' : 'mb-4'}`}
          id="purchase-sign-in-email"
          type="email"
          label={c('Label').t`Email`}
          value={email}
          onChange={handleEmailChange}
          ref={emailInputRef}
          disabled={isCreatingAccount}
          isInvalid={isEmailInvalid}
        />
        {isEmailInvalid ? <div className="mb-4 text-danger">{c('Error').t`Please provide a valid email.`}</div> : null}
        <FloatingLabelInput
          className="min-w-auto mb-4 md:min-w-90"
          id="purchase-create-account-password"
          type="password"
          label={c('Label').t`Password`}
          value={password}
          onChange={handlePasswordChange}
          ref={passwordInputRef}
          disabled={isCreatingAccount}
        />
        <FloatingLabelInput
          className={`min-w-auto md:min-w-90 ${isPasswordNotMatching ? 'mb-2' : 'mb-4'}`}
          id="create-account-confirm"
          type="password"
          label={c('Label').t`Repeat password`}
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          ref={confirmPasswordInputRef}
          disabled={isCreatingAccount}
          isInvalid={isPasswordNotMatching}
        />
        {isPasswordNotMatching ? (
          <div className="mb-4 text-danger">{c('Error').t`Passwords don't match. Please try again.`}</div>
        ) : null}
      </div>
    </form>
  )

  return (
    <div className="flex items-center">
      <CircleIcon className="absolute -left-28 top-[40%] h-8 w-8" />
      <BlueDotIcon className="absolute -left-10 top-[35%] h-4 w-4" />
      <DiamondIcon className="absolute -bottom-5 left-0 -z-[1] h-26 w-26 -translate-x-1/2" />

      <CircleIcon className="absolute -right-20 bottom-[35%] h-8 w-8" />
      <BlueDotIcon className="absolute -right-10 bottom-[25%] h-4 w-4" />
      <DiamondIcon className="absolute -right-2 top-0 -z-[1] h-18 w-18 translate-x-1/2" />

      <div className="mr-0 lg:mr-12">
        {
          // translator: Full sentence: "Create your free account"
          <h1 className="mb-2 mt-0 text-2xl font-bold">{c('Title').t`Create your free account`}</h1>
        }
        {
          // translator: Full sentence: "Create your free account to continue to Standard Notes."
          <div className="mb-4 text-sm font-medium">{c('Info').t`to continue to Standard Notes.`}</div>
        }
        {captchaURL ? captchaIframe : CreateAccountForm}
        <div className="flex flex-col-reverse items-start justify-between md:flex-row md:items-center">
          <div className="flex flex-col">
            <button
              onClick={handleSignInInstead}
              disabled={isCreatingAccount}
              className="mb-2 flex cursor-pointer items-start border-0 bg-default p-0 font-medium text-info hover:underline"
            >
              {
                // translator: "Instead" here refers to "instead of creating an account"
                c('Action').t`Sign in instead`
              }
            </button>
            {!application.isNativeIOS() && (
              <button
                onClick={subscribeWithoutAccount}
                disabled={isCreatingAccount}
                className="flex cursor-pointer items-start border-0 bg-default p-0 font-medium text-info hover:underline"
              >
                {c('Action').t`Subscribe without account`}
              </button>
            )}
          </div>
          <Button
            className="mb-4 py-2.5 md:mb-0"
            primary
            label={isCreatingAccount ? c('Action').t`Creating account...` : c('Action').t`Create account`}
            onClick={handleCreateAccount}
            disabled={isCreatingAccount}
          />
        </div>
      </div>
      <CreateAccountIllustration className="hidden lg:block" />
    </div>
  )
}

export default observer(CreateAccount)

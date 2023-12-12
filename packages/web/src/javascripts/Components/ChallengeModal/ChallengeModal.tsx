import { WebApplication } from '@/Application/WebApplication'
import {
  ButtonType,
  Challenge,
  ChallengePrompt,
  ChallengeReason,
  ChallengeValidation,
  ChallengeValue,
  removeFromArray,
} from '@standardnotes/snjs'
import { ProtectedIllustration } from '@standardnotes/icons'
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import ChallengeModalPrompt from './ChallengePrompt'
import LockscreenWorkspaceSwitcher from './LockscreenWorkspaceSwitcher'
import { WebApplicationGroup } from '@/Application/WebApplicationGroup'
import { ChallengeModalValues } from './ChallengeModalValues'
import { InputValue } from './InputValue'
import { classNames } from '@standardnotes/utils'
import ModalOverlay from '../Modal/ModalOverlay'
import Modal from '../Modal/Modal'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { useAutoElementRect } from '@/Hooks/useElementRect'

type Props = {
  application: WebApplication
  mainApplicationGroup: WebApplicationGroup
  challenge: Challenge
  onDismiss?: (challenge: Challenge) => void
}

const validateValues = (values: ChallengeModalValues, prompts: ChallengePrompt[]): ChallengeModalValues | undefined => {
  let hasInvalidValues = false
  const validatedValues = { ...values }
  for (const prompt of prompts) {
    const value = validatedValues[prompt.id]
    if (typeof value.value === 'string' && value.value.length === 0) {
      validatedValues[prompt.id].invalid = true
      hasInvalidValues = true
    }
  }
  if (!hasInvalidValues) {
    return validatedValues
  }
  return undefined
}

const ChallengeModal: FunctionComponent<Props> = ({ application, mainApplicationGroup, challenge, onDismiss }) => {
  const promptsContainerRef = useRef<HTMLFormElement>(null)

  const [values, setValues] = useState<ChallengeModalValues>(() => {
    const values = {} as ChallengeModalValues
    for (const prompt of challenge.prompts) {
      values[prompt.id] = {
        prompt,
        value: prompt.initialValue ?? '',
        invalid: false,
      }
    }
    return values
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [, setProcessingPrompts] = useState<ChallengePrompt[]>([])

  const shouldShowForgotPasscode = [ChallengeReason.ApplicationUnlock, ChallengeReason.Migration].includes(
    challenge.reason,
  )

  const shouldShowWorkspaceSwitcher = challenge.reason === ChallengeReason.ApplicationUnlock

  const submit = useCallback(() => {
    const validatedValues = validateValues(values, challenge.prompts)
    if (!validatedValues) {
      return
    }
    if (isSubmitting || isProcessing) {
      return
    }
    setIsSubmitting(true)
    setIsProcessing(true)

    const valuesToProcess: ChallengeValue[] = []
    for (const inputValue of Object.values(validatedValues)) {
      const rawValue = inputValue.value
      const value = { prompt: inputValue.prompt, value: rawValue }
      valuesToProcess.push(value)
    }

    const processingPrompts = valuesToProcess.map((v) => v.prompt)
    setIsProcessing(processingPrompts.length > 0)
    setProcessingPrompts(processingPrompts)
    /**
     * Unfortunately neccessary to wait 50ms so that the above setState call completely
     * updates the UI to change processing state, before we enter into UI blocking operation
     * (crypto key generation)
     */
    setTimeout(() => {
      if (valuesToProcess.length > 0) {
        if (challenge.customHandler) {
          void challenge.customHandler(challenge, valuesToProcess)
        } else {
          application.submitValuesForChallenge(challenge, valuesToProcess).catch(console.error)
        }
      } else {
        setIsProcessing(false)
      }
      setIsSubmitting(false)
    }, 50)
  }, [application, challenge, isProcessing, isSubmitting, values])

  const onValueChange = useCallback(
    (value: InputValue['value'], prompt: ChallengePrompt) => {
      const newValues = { ...values }
      newValues[prompt.id].invalid = false
      newValues[prompt.id].value = value
      setValues(newValues)
    },
    [values],
  )

  const cancelChallenge = useCallback(() => {
    if (challenge.cancelable) {
      application.cancelChallenge(challenge)
      onDismiss?.(challenge)
    }
  }, [application, challenge, onDismiss])

  useEffect(() => {
    const removeChallengeObserver = application.addChallengeObserver(challenge, {
      onValidValue: (value) => {
        setValues((values) => {
          const newValues = { ...values }
          newValues[value.prompt.id].invalid = false
          return newValues
        })
        setProcessingPrompts((currentlyProcessingPrompts) => {
          const processingPrompts = currentlyProcessingPrompts.slice()
          removeFromArray(processingPrompts, value.prompt)
          setIsProcessing(processingPrompts.length > 0)
          return processingPrompts
        })
      },
      onInvalidValue: (value) => {
        setValues((values) => {
          const newValues = { ...values }
          newValues[value.prompt.id].invalid = true
          return newValues
        })
        /** If custom validation, treat all values together and not individually */
        if (!value.prompt.validates) {
          setProcessingPrompts([])
          setIsProcessing(false)
        } else {
          setProcessingPrompts((currentlyProcessingPrompts) => {
            const processingPrompts = currentlyProcessingPrompts.slice()
            removeFromArray(processingPrompts, value.prompt)
            setIsProcessing(processingPrompts.length > 0)
            return processingPrompts
          })
        }
      },
      onComplete: () => {
        onDismiss?.(challenge)
      },
      onCancel: () => {
        onDismiss?.(challenge)
      },
    })

    return () => {
      removeChallengeObserver()
    }
  }, [application, challenge, onDismiss])

  const biometricPrompt = challenge.prompts.find((prompt) => prompt.validation === ChallengeValidation.Biometric)
  const authenticatorPrompt = challenge.prompts.find(
    (prompt) => prompt.validation === ChallengeValidation.Authenticator,
  )
  const hasOnlyBiometricPrompt = challenge.prompts.length === 1 && !!biometricPrompt
  const hasOnlyAuthenticatorPrompt = challenge.prompts.length === 1 && !!authenticatorPrompt
  const wasBiometricInputSuccessful = !!biometricPrompt && !!values[biometricPrompt.id].value
  const wasAuthenticatorInputSuccessful = !!authenticatorPrompt && !!values[authenticatorPrompt.id].value
  const hasSecureTextPrompt = challenge.prompts.some((prompt) => prompt.secureTextEntry)
  const shouldShowSubmitButton = !(hasOnlyBiometricPrompt || hasOnlyAuthenticatorPrompt)

  useEffect(() => {
    const shouldAutoSubmit =
      (hasOnlyBiometricPrompt && wasBiometricInputSuccessful) ||
      (hasOnlyAuthenticatorPrompt && wasAuthenticatorInputSuccessful)

    const shouldFocusSecureTextPrompt = hasSecureTextPrompt && wasBiometricInputSuccessful

    if (shouldAutoSubmit) {
      submit()
    } else if (shouldFocusSecureTextPrompt) {
      const secureTextEntry = promptsContainerRef.current?.querySelector(
        'input[type="password"]',
      ) as HTMLInputElement | null
      secureTextEntry?.focus()
    }
  }, [
    wasBiometricInputSuccessful,
    hasOnlyBiometricPrompt,
    submit,
    hasSecureTextPrompt,
    hasOnlyAuthenticatorPrompt,
    wasAuthenticatorInputSuccessful,
  ])

  useEffect(() => {
    const removeListener = application.addAndroidBackHandlerEventListener(() => {
      if (challenge.cancelable) {
        cancelChallenge()
      }
      return true
    })
    return () => {
      if (removeListener) {
        removeListener()
      }
    }
  }, [application, cancelChallenge, challenge.cancelable])

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)
  const isFullScreenBlocker = challenge.reason === ChallengeReason.ApplicationUnlock

  const [modalElement, setModalElement] = useState<HTMLDivElement | null>(null)
  const modalElementRect = useAutoElementRect(modalElement, {
    updateOnWindowResize: true,
  })

  return (
    <ModalOverlay
      isOpen={true}
      key={challenge.id}
      ref={setModalElement}
      close={cancelChallenge}
      hideOnInteractOutside={false}
      backdropClassName={isFullScreenBlocker ? 'bg-passive-5' : ''}
      className={classNames(
        'sn-component challenge-modal relative m-0 flex h-full w-full flex-col items-center rounded border-solid border-border bg-default p-0 md:h-auto md:!w-max',
        !isMobileScreen && 'shadow-overlay-light',
      )}
    >
      <Modal
        title="Authenticate"
        close={cancelChallenge}
        customHeader={<></>}
        customFooter={<></>}
        disableCustomHeader={isMobileScreen}
        actions={[
          {
            label: 'Cancel',
            onClick: cancelChallenge,
            type: 'primary',
            hidden: !challenge.cancelable,
            mobileSlot: 'right',
          },
        ]}
      >
        {challenge.cancelable && (
          <button
            onClick={cancelChallenge}
            aria-label="Close modal"
            className="absolute right-4 top-4 hidden cursor-pointer border-0 bg-transparent p-1 md:flex"
          >
            <Icon type="close" className="text-neutral" />
          </button>
        )}
        <div className="flex min-h-0 w-full flex-grow flex-col items-center overflow-auto p-8">
          <ProtectedIllustration
            className={classNames(
              'mb-4 h-30 w-30 flex-shrink-0',
              modalElementRect && modalElementRect.height < 500 ? 'hidden md:block' : '',
            )}
          />
          <div className="mb-3 max-w-76 text-center text-lg font-bold">{challenge.heading}</div>
          {challenge.subheading && (
            <div className="break-word mb-4 max-w-76 text-center text-sm">{challenge.subheading}</div>
          )}
          <form
            className="flex w-full max-w-76 flex-col items-center md:min-w-76"
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
            ref={promptsContainerRef}
          >
            {challenge.prompts.map((prompt, index) => (
              <ChallengeModalPrompt
                application={application}
                key={prompt.id}
                prompt={prompt}
                values={values}
                index={index}
                onValueChange={onValueChange}
                isInvalid={values[prompt.id].invalid}
                contextData={prompt.contextData}
              />
            ))}
          </form>
          {shouldShowSubmitButton && (
            <Button primary disabled={isProcessing} className="mb-3.5 mt-1 min-w-76" onClick={submit}>
              {isProcessing ? 'Generating Keys...' : 'Submit'}
            </Button>
          )}
          {shouldShowForgotPasscode && (
            <Button
              className="flex min-w-76 items-center justify-center"
              onClick={() => {
                application.alerts
                  .confirm(
                    'If you forgot your local passcode, your only option is to clear your local data from this device and sign back in to your account.',
                    'Forgot passcode?',
                    'Delete local data',
                    ButtonType.Danger,
                  )
                  .then((shouldDeleteLocalData) => {
                    if (shouldDeleteLocalData) {
                      application.user.signOut().catch(console.error)
                    }
                  })
                  .catch(console.error)
              }}
            >
              <Icon type="help" className="mr-2 text-neutral" />
              Forgot passcode?
            </Button>
          )}
          {shouldShowWorkspaceSwitcher && <LockscreenWorkspaceSwitcher mainApplicationGroup={mainApplicationGroup} />}
        </div>
      </Modal>
    </ModalOverlay>
  )
}

export default ChallengeModal

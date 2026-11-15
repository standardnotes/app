import { WebApplication } from '@/Application/WebApplication'
import { c } from 'ttag'
import { Challenge, ChallengePrompt, ChallengeValidation, ChallengeValue, removeFromArray } from '@standardnotes/snjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import Button from '@/Components/Button/Button'
import ChallengeModalPrompt from './ChallengePrompt'
import { ChallengeModalValues } from './ChallengeModalValues'
import { InputValue } from './InputValue'

type Props = {
  application: WebApplication
  challenge: Challenge
  /** Called once the challenge has been completed or canceled. */
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

/**
 * The prompts of a challenge and its submit button, without any surrounding chrome.
 * Used by the challenge modal, and inline where a challenge is shown in place (e.g. a protected note).
 */
const ChallengeForm = ({ application, challenge, onDismiss }: Props) => {
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

  return (
    <>
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
          {isProcessing
            ? c('B5.SecuritySync.Challenge.Status').t`Generating Keys...`
            : c('B5.SecuritySync.Challenge.Action').t`Submit`}
        </Button>
      )}
    </>
  )
}

export default ChallengeForm

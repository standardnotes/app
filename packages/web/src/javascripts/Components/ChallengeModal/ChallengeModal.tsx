import { WebApplication } from '@/Application/Application'
import { DialogContent, DialogOverlay } from '@reach/dialog'
import {
  ButtonType,
  Challenge,
  ChallengePrompt,
  ChallengeReason,
  ChallengeValue,
  removeFromArray,
} from '@standardnotes/snjs'
import { ProtectedIllustration } from '@standardnotes/icons'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import ChallengeModalPrompt from './ChallengePrompt'
import LockscreenWorkspaceSwitcher from './LockscreenWorkspaceSwitcher'
import { ApplicationGroup } from '@/Application/ApplicationGroup'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { ChallengeModalValues } from './ChallengeModalValues'
import { InputValue } from './InputValue'

type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
  mainApplicationGroup: ApplicationGroup
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

const ChallengeModal: FunctionComponent<Props> = ({
  application,
  viewControllerManager,
  mainApplicationGroup,
  challenge,
  onDismiss,
}) => {
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
  const [bypassModalFocusLock, setBypassModalFocusLock] = useState(false)

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
        application.submitValuesForChallenge(challenge, valuesToProcess).catch(console.error)
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

  if (!challenge.prompts) {
    return null
  }

  return (
    <DialogOverlay
      className={`sn-component ${
        challenge.reason === ChallengeReason.ApplicationUnlock ? 'challenge-modal-overlay' : ''
      }`}
      onDismiss={cancelChallenge}
      dangerouslyBypassFocusLock={bypassModalFocusLock}
      key={challenge.id}
    >
      <DialogContent
        aria-label="Challenge modal"
        className={`challenge-modal relative flex flex-col items-center rounded bg-default p-8 ${
          challenge.reason !== ChallengeReason.ApplicationUnlock
            ? 'shadow-overlay-light border border-solid border-border'
            : 'focus:shadow-none'
        }`}
      >
        {challenge.cancelable && (
          <button
            onClick={cancelChallenge}
            aria-label="Close modal"
            className="absolute top-4 right-4 flex cursor-pointer border-0 bg-transparent p-1"
          >
            <Icon type="close" className="text-neutral" />
          </button>
        )}
        <ProtectedIllustration className="mb-4 h-30 w-30" />
        <div className="mb-3 max-w-76 text-center text-lg font-bold">{challenge.heading}</div>
        {challenge.subheading && (
          <div className="break-word mb-4 max-w-76 text-center text-sm">{challenge.subheading}</div>
        )}
        <form
          className="flex min-w-76 flex-col items-center"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
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
            />
          ))}
        </form>
        <Button primary disabled={isProcessing} className="mt-1 mb-3.5 min-w-76" onClick={submit}>
          {isProcessing ? 'Generating Keys...' : 'Submit'}
        </Button>
        {shouldShowForgotPasscode && (
          <Button
            className="flex min-w-76 items-center justify-center"
            onClick={() => {
              setBypassModalFocusLock(true)
              application.alertService
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
                .finally(() => {
                  setBypassModalFocusLock(false)
                })
            }}
          >
            <Icon type="help" className="mr-2 text-neutral" />
            Forgot passcode?
          </Button>
        )}
        {shouldShowWorkspaceSwitcher && (
          <LockscreenWorkspaceSwitcher
            mainApplicationGroup={mainApplicationGroup}
            viewControllerManager={viewControllerManager}
          />
        )}
      </DialogContent>
    </DialogOverlay>
  )
}

export default ChallengeModal

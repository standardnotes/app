import { WebApplication } from '@/UIModels/Application'
import { DialogContent, DialogOverlay } from '@reach/dialog'
import {
  ButtonType,
  Challenge,
  ChallengePrompt,
  ChallengeReason,
  ChallengeValue,
  removeFromArray,
} from '@standardnotes/snjs'
import { ProtectedIllustration } from '@standardnotes/stylekit'
import { FunctionComponent } from 'preact'
import { useCallback, useEffect, useState } from 'preact/hooks'
import { Button } from '@/Components/Button/Button'
import { Icon } from '@/Components/Icon'
import { ChallengeModalPrompt } from './ChallengePrompt'
import { LockscreenWorkspaceSwitcher } from './LockscreenWorkspaceSwitcher'
import { ApplicationGroup } from '@/UIModels/ApplicationGroup'
import { AppState } from '@/UIModels/AppState'

type InputValue = {
  prompt: ChallengePrompt
  value: string | number | boolean
  invalid: boolean
}

export type ChallengeModalValues = Record<ChallengePrompt['id'], InputValue>

type Props = {
  application: WebApplication
  appState: AppState
  mainApplicationGroup: ApplicationGroup
  challenge: Challenge
  onDismiss: (challenge: Challenge) => Promise<void>
}

const validateValues = (
  values: ChallengeModalValues,
  prompts: ChallengePrompt[],
): ChallengeModalValues | undefined => {
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

export const ChallengeModal: FunctionComponent<Props> = ({
  application,
  appState,
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
  const shouldShowForgotPasscode = [
    ChallengeReason.ApplicationUnlock,
    ChallengeReason.Migration,
  ].includes(challenge.reason)
  const shouldShowWorkspaceSwitcher = challenge.reason === ChallengeReason.ApplicationUnlock

  const submit = async () => {
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
      const value = new ChallengeValue(inputValue.prompt, rawValue)
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
  }

  const onValueChange = useCallback(
    (value: string | number, prompt: ChallengePrompt) => {
      const newValues = { ...values }
      newValues[prompt.id].invalid = false
      newValues[prompt.id].value = value
      setValues(newValues)
    },
    [values],
  )

  const closeModal = () => {
    if (challenge.cancelable) {
      onDismiss(challenge).catch(console.error)
    }
  }

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
        onDismiss(challenge).catch(console.error)
      },
      onCancel: () => {
        onDismiss(challenge).catch(console.error)
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
      onDismiss={closeModal}
      dangerouslyBypassFocusLock={bypassModalFocusLock}
    >
      <DialogContent
        className={`challenge-modal flex flex-col items-center bg-default p-8 rounded relative ${
          challenge.reason !== ChallengeReason.ApplicationUnlock
            ? 'shadow-overlay-light border-1 border-solid border-main'
            : 'focus:shadow-none'
        }`}
      >
        {challenge.cancelable && (
          <button
            onClick={closeModal}
            aria-label="Close modal"
            className="flex p-1 bg-transparent border-0 cursor-pointer absolute top-4 right-4"
          >
            <Icon type="close" className="color-neutral" />
          </button>
        )}
        <ProtectedIllustration className="w-30 h-30 mb-4" />
        <div className="font-bold text-lg text-center max-w-76 mb-3">{challenge.heading}</div>
        {challenge.subheading && (
          <div className="text-center text-sm max-w-76 mb-4 break-word">{challenge.subheading}</div>
        )}
        <form
          className="flex flex-col items-center min-w-76"
          onSubmit={(e) => {
            e.preventDefault()
            submit().catch(console.error)
          }}
        >
          {challenge.prompts.map((prompt, index) => (
            <ChallengeModalPrompt
              key={prompt.id}
              prompt={prompt}
              values={values}
              index={index}
              onValueChange={onValueChange}
              isInvalid={values[prompt.id].invalid}
            />
          ))}
        </form>
        <Button
          variant="primary"
          disabled={isProcessing}
          className="min-w-76 mt-1 mb-3.5"
          onClick={() => {
            submit().catch(console.error)
          }}
        >
          {isProcessing ? 'Generating Keys...' : 'Submit'}
        </Button>
        {shouldShowForgotPasscode && (
          <Button
            className="flex items-center justify-center min-w-76"
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
            <Icon type="help" className="mr-2 color-neutral" />
            Forgot passcode?
          </Button>
        )}
        {shouldShowWorkspaceSwitcher && (
          <LockscreenWorkspaceSwitcher
            mainApplicationGroup={mainApplicationGroup}
            appState={appState}
          />
        )}
      </DialogContent>
    </DialogOverlay>
  )
}

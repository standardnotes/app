import {
  ChallengePrompt,
  ChallengeValidation,
  ProtectionSessionDurations,
  ReactNativeToWebEvent,
} from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useEffect, useRef } from 'react'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import DecoratedPasswordInput from '@/Components/Input/DecoratedPasswordInput'
import { ChallengeModalValues } from './ChallengeModalValues'
import { WebApplication } from '@/Application/WebApplication'
import { InputValue } from './InputValue'
import BiometricsPrompt from './BiometricsPrompt'
import U2FPrompt from './U2FPrompt'

type Props = {
  application: WebApplication
  prompt: ChallengePrompt
  values: ChallengeModalValues
  index: number
  onValueChange: (value: InputValue['value'], prompt: ChallengePrompt) => void
  isInvalid: boolean
  contextData?: Record<string, unknown>
}

const ChallengeModalPrompt: FunctionComponent<Props> = ({
  application,
  prompt,
  values,
  index,
  onValueChange,
  isInvalid,
  contextData,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const biometricsButtonRef = useRef<HTMLButtonElement>(null)
  const authenticatorButtonRef = useRef<HTMLButtonElement>(null)

  const activatePrompt = useCallback(async () => {
    if (prompt.validation === ChallengeValidation.Biometric) {
      if (application.isNativeMobileWeb()) {
        const appState = await application.mobileDevice.getAppState()

        if (appState !== 'active') {
          return
        }
      }

      const hasUserAlreadyInteracted = typeof values[prompt.id].value === 'boolean'

      if (hasUserAlreadyInteracted) {
        return
      }

      biometricsButtonRef.current?.click()
      return
    }

    const parentForm = inputRef.current?.closest('form')
    if (parentForm?.contains(document.activeElement)) {
      return
    }

    inputRef.current?.focus()
  }, [application, prompt.id, prompt.validation, values])

  useEffect(() => {
    if (!application.isNativeMobileWeb()) {
      return
    }

    const disposeListener = application.addNativeMobileEventListener((event: ReactNativeToWebEvent) => {
      if (event === ReactNativeToWebEvent.GainingFocus) {
        void activatePrompt()
      }
    })

    return () => {
      if (disposeListener) {
        disposeListener()
      }
    }
  }, [activatePrompt, application])

  useEffect(() => {
    const isNotFirstPrompt = index !== 0

    if (isNotFirstPrompt) {
      return
    }

    void activatePrompt()
  }, [activatePrompt, index])

  useEffect(() => {
    if (isInvalid) {
      inputRef.current?.focus()
    }
  }, [isInvalid])

  return (
    <div key={prompt.id} className="mb-3 w-full">
      {prompt.validation === ChallengeValidation.ProtectionSessionDuration ? (
        <div className="min-w-76">
          <div className="mb-2 text-sm font-medium">Allow protected access for</div>
          <div className="flex items-center justify-between rounded bg-passive-4 p-1">
            {ProtectionSessionDurations.map((option) => {
              const selected = option.valueInSeconds === values[prompt.id].value
              return (
                <label
                  key={option.label}
                  className={`relative flex cursor-pointer items-center justify-center rounded px-2 py-1.5 text-center focus-within:ring-2 focus-within:ring-info ${
                    selected ? 'bg-default font-semibold text-foreground' : 'text-passive-0 hover:bg-passive-3'
                  }`}
                >
                  <input
                    type="radio"
                    name={`session-duration-${prompt.id}`}
                    className={
                      'absolute left-0 top-0 m-0 h-px w-px appearance-none focus:shadow-none focus:outline-none'
                    }
                    style={{
                      marginRight: 0,
                    }}
                    checked={selected}
                    onChange={(event) => {
                      event.preventDefault()
                      onValueChange(option.valueInSeconds, prompt)
                    }}
                  />
                  {option.label}
                </label>
              )
            })}
          </div>
        </div>
      ) : prompt.validation === ChallengeValidation.Biometric ? (
        <BiometricsPrompt
          application={application}
          onValueChange={onValueChange}
          prompt={prompt}
          buttonRef={biometricsButtonRef}
        />
      ) : prompt.validation === ChallengeValidation.Authenticator ? (
        <U2FPrompt
          application={application}
          onValueChange={onValueChange}
          prompt={prompt}
          buttonRef={authenticatorButtonRef}
          contextData={contextData}
        />
      ) : prompt.secureTextEntry ? (
        <DecoratedPasswordInput
          ref={inputRef}
          placeholder={prompt.placeholder}
          className={{ container: `w-full max-w-76 ${isInvalid ? 'border-danger' : ''}` }}
          onChange={(value) => onValueChange(value, prompt)}
        />
      ) : (
        <DecoratedInput
          ref={inputRef}
          placeholder={prompt.placeholder}
          className={{ container: `w-full max-w-76 ${isInvalid ? 'border-danger' : ''}` }}
          onChange={(value) => onValueChange(value, prompt)}
        />
      )}
      {isInvalid && <div className="mt-2 text-sm text-danger">Invalid authentication, please try again.</div>}
    </div>
  )
}

export default ChallengeModalPrompt

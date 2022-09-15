import {
  ChallengePrompt,
  ChallengeValidation,
  MobileDeviceInterface,
  ProtectionSessionDurations,
} from '@standardnotes/snjs'
import { FunctionComponent, useEffect, useRef } from 'react'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import DecoratedPasswordInput from '@/Components/Input/DecoratedPasswordInput'
import { ChallengeModalValues } from './ChallengeModalValues'
import Button from '../Button/Button'
import { WebApplication } from '@/Application/Application'
import { InputValue } from './InputValue'

type Props = {
  application: WebApplication
  prompt: ChallengePrompt
  values: ChallengeModalValues
  index: number
  onValueChange: (value: InputValue['value'], prompt: ChallengePrompt) => void
  isInvalid: boolean
}

const ChallengeModalPrompt: FunctionComponent<Props> = ({
  application,
  prompt,
  values,
  index,
  onValueChange,
  isInvalid,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const biometricsButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const isNotFirstPrompt = index !== 0

    if (isNotFirstPrompt) {
      return
    }

    if (prompt.validation === ChallengeValidation.Biometric) {
      biometricsButtonRef.current?.click()
    } else {
      inputRef.current?.focus()
    }
  }, [index, prompt.validation])

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
                  className={`cursor-pointer rounded px-2 py-1.5 focus-within:ring-2 focus-within:ring-info ${
                    selected ? 'bg-default font-semibold text-foreground' : 'text-passive-0 hover:bg-passive-3'
                  }`}
                >
                  <input
                    type="radio"
                    name={`session-duration-${prompt.id}`}
                    className={'m-0 appearance-none focus:shadow-none focus:outline-none'}
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
        <div className="min-w-76">
          <Button
            primary
            fullWidth
            onClick={async () => {
              const authenticated = await (
                application.deviceInterface as MobileDeviceInterface
              ).authenticateWithBiometrics()
              onValueChange(authenticated, prompt)
            }}
            ref={biometricsButtonRef}
          >
            Tap to use biometrics
          </Button>
        </div>
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

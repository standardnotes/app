import { ChallengePrompt, ChallengeValidation, ProtectionSessionDurations } from '@standardnotes/snjs'
import { FunctionComponent, useEffect, useRef } from 'react'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import DecoratedPasswordInput from '@/Components/Input/DecoratedPasswordInput'
import { ChallengeModalValues } from './ChallengeModalValues'

type Props = {
  prompt: ChallengePrompt
  values: ChallengeModalValues
  index: number
  onValueChange: (value: string | number, prompt: ChallengePrompt) => void
  isInvalid: boolean
}

const ChallengeModalPrompt: FunctionComponent<Props> = ({ prompt, values, index, onValueChange, isInvalid }) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (index === 0) {
      inputRef.current?.focus()
    }
  }, [index])

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
      ) : prompt.secureTextEntry ? (
        <DecoratedPasswordInput
          ref={inputRef}
          placeholder={prompt.placeholder}
          className={`w-full max-w-76 ${isInvalid ? 'border-danger' : ''}`}
          onChange={(value) => onValueChange(value, prompt)}
        />
      ) : (
        <DecoratedInput
          ref={inputRef}
          placeholder={prompt.placeholder}
          className={`w-full max-w-76 ${isInvalid ? 'border-danger' : ''}`}
          onChange={(value) => onValueChange(value, prompt)}
        />
      )}
      {isInvalid && <div className="mt-2 text-sm text-danger">Invalid authentication, please try again.</div>}
    </div>
  )
}

export default ChallengeModalPrompt

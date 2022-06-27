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
    <div key={prompt.id} className="w-full mb-3">
      {prompt.validation === ChallengeValidation.ProtectionSessionDuration ? (
        <div className="min-w-76">
          <div className="text-sm font-medium mb-2">Allow protected access for</div>
          <div className="flex items-center justify-between bg-passive-4 rounded p-1">
            {ProtectionSessionDurations.map((option) => {
              const selected = option.valueInSeconds === values[prompt.id].value
              return (
                <label
                  key={option.label}
                  className={`cursor-pointer px-2 py-1.5 rounded focus-within:ring-2 focus-within:ring-info ${
                    selected ? 'bg-default text-foreground font-semibold' : 'text-passive-0 hover:bg-passive-3'
                  }`}
                >
                  <input
                    type="radio"
                    name={`session-duration-${prompt.id}`}
                    className={'appearance-none m-0 focus:shadow-none focus:outline-none'}
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
      {isInvalid && <div className="text-sm text-danger mt-2">Invalid authentication, please try again.</div>}
    </div>
  )
}

export default ChallengeModalPrompt

import { KeySystemPasswordType, classNames } from '@standardnotes/snjs'
import StyledRadioInput from '@/Components/Radio/StyledRadioInput'
import DecoratedPasswordInput from '@/Components/Input/DecoratedPasswordInput'
import { useState } from 'react'

type PasswordTypePreference = {
  value: KeySystemPasswordType
  label: string
  description: string
}

const options: PasswordTypePreference[] = [
  {
    value: KeySystemPasswordType.Randomized,
    label: 'Randomized (Recommended)',
    description: 'Your vault key will be randomly generated and synced to your account.',
  },
  {
    value: KeySystemPasswordType.UserInputted,
    label: 'Custom (Advanced)',
    description:
      'Choose your own key for your vault. This is an advanced option and is not recommended for most users.',
  },
]

export const PasswordTypePreference = ({
  value,
  onChange,
  onCustomKeyChange,
}: {
  value: KeySystemPasswordType
  onChange: (value: KeySystemPasswordType) => void
  onCustomKeyChange: (value: string) => void
}) => {
  const [customKey, setCustomKey] = useState('')

  const onKeyInputChange = (value: string) => {
    setCustomKey(value)
    onCustomKeyChange(value)
  }

  return (
    <div>
      <div className="mb-3 text-lg">Vault Key Type</div>
      <div className="mb-1 space-y-3">
        {options.map((option) => {
          const isSelected = value === option.value
          return (
            <label
              key={option.value}
              className="grid grid-cols-[auto,1fr] gap-x-[0.65rem] gap-y-1 text-base font-medium md:text-sm"
            >
              <StyledRadioInput
                className="col-start-1 col-end-2 place-self-center"
                name="option"
                checked={isSelected}
                onChange={() => {
                  onChange(option.value)
                }}
              />
              <div className={classNames('select-none', isSelected ? 'font-semibold' : '')}>{option.label}</div>
              <div className="col-start-2 row-start-2 text-sm opacity-80">{option.description}</div>
            </label>
          )
        })}
      </div>
      {value === KeySystemPasswordType.UserInputted && (
        <div className="mt-2">
          <DecoratedPasswordInput
            placeholder="Choose a password"
            id="key-input"
            value={customKey}
            onChange={onKeyInputChange}
            type="password"
          />
        </div>
      )}
    </div>
  )
}

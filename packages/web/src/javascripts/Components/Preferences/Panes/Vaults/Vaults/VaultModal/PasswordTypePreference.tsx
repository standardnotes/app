import { KeySystemRootKeyPasswordType } from '@standardnotes/snjs'
import StyledRadioInput from '@/Components/Radio/StyledRadioInput'
import DecoratedPasswordInput from '@/Components/Input/DecoratedPasswordInput'
import { useState } from 'react'

type PasswordTypePreference = {
  value: KeySystemRootKeyPasswordType
  label: string
  description: string
}

const options: PasswordTypePreference[] = [
  {
    value: KeySystemRootKeyPasswordType.Randomized,
    label: 'Randomized (Recommended)',
    description: 'Your vault key will be randomly generated and synced to your account.',
  },
  {
    value: KeySystemRootKeyPasswordType.UserInputted,
    label: 'Custom (Advanced)',
    description:
      'Choose your own key for your vault. This is an advanced option and is not recommended, as keeping track of multiple keys can be difficult.',
  },
]

export const PasswordTypePreference = ({
  value,
  onChange,
  onCustomKeyChange,
}: {
  value: KeySystemRootKeyPasswordType
  onChange: (value: KeySystemRootKeyPasswordType) => void
  onCustomKeyChange: (value: string) => void
}) => {
  const [customKey, setCustomKey] = useState('')

  const onKeyInputChange = (value: string) => {
    setCustomKey(value)
    onCustomKeyChange(value)
  }

  return (
    <div className="mb-3">
      <div className="mb-3 text-lg">Vault Key Type</div>
      {options.map((option) => {
        return (
          <label key={option.value} className="mb-2 flex items-center gap-2 text-base font-medium md:text-sm">
            <StyledRadioInput
              name="option"
              checked={value === option.value}
              onChange={() => {
                onChange(option.value)
              }}
            />
            {option.label}
          </label>
        )
      })}

      {value === KeySystemRootKeyPasswordType.UserInputted && (
        <div>
          <div className="text-gray-500 mt-3 text-sm">{options[1].description}</div>

          <label htmlFor="key-input" className="mb-1 block">
            Current Password
          </label>

          <DecoratedPasswordInput id="key-input" value={customKey} onChange={onKeyInputChange} type="password" />
        </div>
      )}
    </div>
  )
}

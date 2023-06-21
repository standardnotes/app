import { KeySystemRootKeyStorageType } from '@standardnotes/snjs'
import StyledRadioInput from '@/Components/Radio/StyledRadioInput'

type KeyStorageOption = {
  value: KeySystemRootKeyStorageType
  label: string
  description: string
}

const options: KeyStorageOption[] = [
  {
    value: KeySystemRootKeyStorageType.Synced,
    label: 'Synced (Recommended)',
    description:
      'Your vault key will be encrypted and synced to your account and automatically available on your other devices.',
  },
  {
    value: KeySystemRootKeyStorageType.Local,
    label: 'Local',
    description:
      'Your vault key will be encrypted and saved locally on this device. You will need to manually enter your vault key on your other devices.',
  },
  {
    value: KeySystemRootKeyStorageType.Ephemeral,
    label: 'Ephemeral',
    description:
      'Your vault key will only be stored in memory and will be forgotten when you close the app. You will need to manually enter your vault key on your other devices.',
  },
]

export const KeyStoragePreference = ({
  value,
  onChange,
}: {
  value: KeySystemRootKeyStorageType
  onChange: (value: KeySystemRootKeyStorageType) => void
}) => {
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
    </div>
  )
}

import { KeySystemRootKeyStorageMode, classNames } from '@standardnotes/snjs'
import StyledRadioInput from '@/Components/Radio/StyledRadioInput'
import { c } from 'ttag'

type KeyStorageOption = {
  value: KeySystemRootKeyStorageMode
  label: string
  description: string
}

const getOptions = (): KeyStorageOption[] => [
  {
    value: KeySystemRootKeyStorageMode.Synced,
    label: c('B6.Preferences.Vaults.Label').t`Synced (Recommended)`,
    description: c('B6.Preferences.Vaults.Info')
      .t`Your vault key will be encrypted and synced to your account and automatically available on your other devices.`,
  },
  {
    value: KeySystemRootKeyStorageMode.Local,
    label: c('B6.Preferences.Vaults.Label').t`Local`,
    description: c('B6.Preferences.Vaults.Info')
      .t`Your vault key will be encrypted and saved locally on this device. You will need to manually enter your vault key on your other devices.`,
  },
  {
    value: KeySystemRootKeyStorageMode.Ephemeral,
    label: c('B6.Preferences.Vaults.Label').t`Ephemeral`,
    description: c('B6.Preferences.Vaults.Info')
      .t`Your vault key will only be stored in memory and will be forgotten when you close the app. You will need to manually enter your vault key on your other devices.`,
  },
]

export const KeyStoragePreference = ({
  value,
  onChange,
}: {
  value: KeySystemRootKeyStorageMode
  onChange: (value: KeySystemRootKeyStorageMode) => void
}) => {
  const options = getOptions()

  return (
    <div>
      <div className="mb-3 text-lg">{c('B6.Preferences.Vaults.Title').t`Vault Key Storage Mode`}</div>
      <div className="space-y-3">
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
    </div>
  )
}

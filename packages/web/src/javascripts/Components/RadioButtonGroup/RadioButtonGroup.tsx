import { VisuallyHidden, Radio, RadioGroup, useRadioStore } from '@ariakit/react'
import { classNames } from '@standardnotes/utils'

type Props = {
  items: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
  className?: string
}

const RadioButtonGroup = ({ value, items, onChange, className }: Props) => {
  const radio = useRadioStore({
    value,
    orientation: 'horizontal',
    setValue(value) {
      onChange(value as string)
    },
  })

  return (
    <RadioGroup
      store={radio}
      className={`flex divide-x divide-border rounded border border-border md:translucent-ui:border-[--popover-border-color] ${
        className ?? ''
      }`}
    >
      {items.map(({ label, value: itemValue }) => (
        <label
          className={classNames(
            'flex-grow select-none px-3.5 py-1.5 text-center',
            'first:rounded-bl first:rounded-tl last:rounded-br last:rounded-tr',
            itemValue === value &&
              'bg-info-backdrop font-medium text-info ring-1 ring-inset ring-info focus-within:ring-2',
          )}
          key={itemValue}
        >
          <VisuallyHidden>
            <Radio value={itemValue} />
          </VisuallyHidden>
          {label}
        </label>
      ))}
    </RadioGroup>
  )
}

export default RadioButtonGroup

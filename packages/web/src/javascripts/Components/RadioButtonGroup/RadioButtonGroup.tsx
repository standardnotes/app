import { VisuallyHidden, Radio, RadioGroup, useRadioStore } from '@ariakit/react'
import { classNames } from '@standardnotes/utils'

type Props<Value extends string> = {
  items: { label: string; value: Value }[]
  value: Value
  onChange: (value: Value) => void
  className?: string
}

function RadioButtonGroup<Value extends string>({ value, items, onChange, className }: Props<Value>) {
  const radio = useRadioStore({
    value,
    orientation: 'horizontal',
    setValue(value) {
      onChange(value as Value)
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

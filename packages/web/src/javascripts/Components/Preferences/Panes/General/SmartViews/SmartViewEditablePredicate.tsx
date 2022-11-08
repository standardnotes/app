import { Predicate, DecryptedItem } from '@standardnotes/snjs'
import { useState } from 'react'
import { NonCompoundPredicateOperators } from './NonCompoundPredicateOperators'

type Props = {
  predicate: Predicate<DecryptedItem>
  onPredicateChange: (predicate: Predicate<DecryptedItem>) => void
}

const SmartViewEditablePredicate = (props: Props) => {
  const [keypath, setKeypath] = useState(props.predicate.keypath)
  const [operator, setOperator] = useState(props.predicate.operator)
  const [value, setValue] = useState(props.predicate.targetValue)

  const handlePredicateChange = () => {
    const predicate = new Predicate<DecryptedItem>(keypath, operator, value)
    props.onPredicateChange(predicate)
  }

  return (
    <div className="flex items-center gap-2.5">
      <input
        className="flex-grow rounded border border-border py-1 px-2"
        placeholder="Keypath"
        value={keypath}
        onChange={(event) => {
          const newKeypath = event.target.value as typeof keypath
          setKeypath(newKeypath)
          handlePredicateChange()
        }}
      />
      <select
        className="rounded border border-border bg-default py-1 px-2"
        value={operator}
        onChange={(event) => {
          const newOperator = event.target.value as typeof operator
          setOperator(newOperator)
          handlePredicateChange()
        }}
      >
        {NonCompoundPredicateOperators.map((operator) => (
          <option key={operator}>{operator}</option>
        ))}
      </select>
      <input
        className="flex-grow rounded border border-border py-1 px-2"
        placeholder="Value"
        value={value.toString()}
        onChange={(event) => {
          const newValue = event.target.value as typeof value
          setValue(newValue)
          handlePredicateChange()
        }}
      />
    </div>
  )
}

export default SmartViewEditablePredicate

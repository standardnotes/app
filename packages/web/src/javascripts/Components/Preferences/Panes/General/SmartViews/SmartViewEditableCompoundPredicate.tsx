import { Predicate, DecryptedItem, CompoundPredicate } from '@standardnotes/snjs'
import { Fragment, useState } from 'react'
import SmartViewEditablePredicate from './SmartViewEditablePredicate'

type Props = {
  predicate: CompoundPredicate<DecryptedItem>
  onPredicateChange: (predicate: CompoundPredicate<DecryptedItem>) => void
}

const SmartViewEditableCompoundPredicate = ({ predicate, onPredicateChange }: Props) => {
  const [subPredicates, setSubPredicates] = useState(predicate.predicates)

  const handleSubPredicateChange = () => {
    const compoundPredicate = new CompoundPredicate<DecryptedItem>(predicate.operator, subPredicates)
    onPredicateChange(compoundPredicate)
  }

  return (
    <>
      {subPredicates.map((subPredicate, index, array) => {
        if (!(subPredicate instanceof Predicate)) {
          return null
        }
        return index !== array.length - 1 ? (
          <Fragment key={index}>
            <SmartViewEditablePredicate
              predicate={subPredicate}
              onPredicateChange={(newSubPredicate) => {
                setSubPredicates((subPredicates) => {
                  const newSubPredicates = [...subPredicates]
                  newSubPredicates[index] = newSubPredicate
                  return newSubPredicates
                })
                handleSubPredicateChange()
              }}
            />
            <div className="flex items-center justify-end gap-2.5">
              <div role="separator" className="h-px flex-grow bg-border" />
              <div className="rounded border border-border bg-default py-1 px-2">{predicate.operator}</div>
            </div>
          </Fragment>
        ) : (
          <SmartViewEditablePredicate
            predicate={subPredicate}
            onPredicateChange={(newSubPredicate) => {
              setSubPredicates((subPredicates) => {
                const newSubPredicates = [...subPredicates]
                newSubPredicates[index] = newSubPredicate
                return newSubPredicates
              })
              handleSubPredicateChange()
            }}
            key={index}
          />
        )
      })}
    </>
  )
}

export default SmartViewEditableCompoundPredicate

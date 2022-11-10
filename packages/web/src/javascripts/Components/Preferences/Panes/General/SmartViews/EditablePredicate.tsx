import Icon from '@/Components/Icon/Icon'
import {
  AllPredicateCompoundOperators,
  isSureValue,
  isValuePredicateJsonFormArray,
  PredicateCompoundOperator,
  PredicateOperator,
} from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { Fragment } from 'react'
import { AddSmartViewModalController } from './AddSmartViewModalController'
import { NonCompoundPredicateOperators } from './NonCompoundPredicateOperators'

const CompoundPredicateCreatorForm = ({ controller }: { controller: AddSmartViewModalController }) => {
  return (
    <form
      className="flex items-center gap-2.5"
      onSubmit={(event) => {
        event.preventDefault()

        const operatorSelectElement = event.currentTarget.elements.namedItem('compound-operator') as HTMLSelectElement
        const operator = operatorSelectElement.value as PredicateCompoundOperator

        controller.createCompoundPredicateFromCurrentPredicate(operator)
      }}
    >
      <div role="separator" className="w-full border border-border" />
      <select
        className="rounded border border-border bg-default py-1.5 px-2 focus:outline focus:outline-1 focus:outline-info"
        name="compound-operator"
      >
        <option value="and">and</option>
        <option value="or">or</option>
      </select>
      <button className="rounded border border-border p-2" type="submit" aria-label="Add another predicate">
        <Icon type="add" size="small" />
      </button>
    </form>
  )
}

const EditablePredicate = ({
  predicate,
  setPredicate,
  controller,
  isSubPredicate,
}: {
  predicate: AddSmartViewModalController['predicate']
  setPredicate: AddSmartViewModalController['setPredicate']
  controller: AddSmartViewModalController
  isSubPredicate: boolean
}) => {
  const isCompoundPredicate = AllPredicateCompoundOperators.includes(predicate.operator as PredicateCompoundOperator)
  const hasSureValue = isSureValue(predicate.value)

  if (isCompoundPredicate) {
    return isValuePredicateJsonFormArray(predicate.value) ? (
      <>
        {predicate.value.map((subPredicate, index, array) => {
          const isLastSubPredicate = index === array.length - 1

          const setSubPredicate: AddSmartViewModalController['setPredicate'] = (subPredicate) => {
            const newPredicate = { ...predicate, value: predicate.value }
            if (!isValuePredicateJsonFormArray(newPredicate.value)) {
              throw new Error('Expected predicate value to be an array of predicate objects')
            }
            const currentPredicateValue = newPredicate.value[index]
            newPredicate.value[index] = {
              ...currentPredicateValue,
              ...subPredicate,
            }
            setPredicate(newPredicate)
          }

          return (
            <Fragment key={index}>
              <EditablePredicate
                predicate={subPredicate}
                setPredicate={setSubPredicate}
                controller={controller}
                isSubPredicate={true}
              />
              {isLastSubPredicate ? (
                <CompoundPredicateCreatorForm controller={controller} />
              ) : (
                <div className="text-sm font-semibold">{predicate.operator}</div>
              )}
            </Fragment>
          )
        })}
      </>
    ) : null
  }

  return (
    <>
      <div className="flex items-center gap-2.5">
        {predicate.keypath != undefined && (
          <input
            className="flex-grow rounded border border-border py-1 px-2"
            value={predicate.keypath}
            onChange={(event) => {
              const value = event.target.value
              setPredicate({
                keypath: value,
              })
            }}
          />
        )}
        <select
          className="rounded border border-border bg-default py-1.5 px-2 focus:outline focus:outline-1 focus:outline-info"
          value={predicate.operator}
          onChange={(event) => {
            const value = event.target.value
            setPredicate({
              operator: value as PredicateOperator,
            })
          }}
        >
          {NonCompoundPredicateOperators.map((operator) => (
            <option key={operator} value={operator}>
              {operator}
            </option>
          ))}
        </select>
        {hasSureValue && (
          <input
            className="flex-grow rounded border border-border py-1 px-2"
            value={predicate.value.toString()}
            onChange={(event) => {
              const value = event.target.value
              setPredicate({
                value,
              })
            }}
          />
        )}
      </div>
      {hasSureValue && !isSubPredicate && <CompoundPredicateCreatorForm controller={controller} />}
    </>
  )
}

export default observer(EditablePredicate)

import { AllNonCompoundPredicateOperators, PredicateCompoundOperator, PredicateOperator } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import Button from '../Button/Button'
import Icon from '../Icon/Icon'
import { CompoundPredicateBuilderController } from './CompoundPredicateBuilderController'
import { PredicateKeypath, PredicateKeypathLabels, PredicateKeypathTypes } from './PredicateKeypaths'
import PredicateValue from './PredicateValue'

type Props = {
  controller: CompoundPredicateBuilderController
}

const CompoundPredicateBuilder = ({ controller }: Props) => {
  const { operator, setOperator, predicates, setPredicate, changePredicateKeypath, addPredicate, removePredicate } =
    controller

  return (
    <>
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="predicate"
            value="and"
            checked={operator === 'and'}
            onChange={(event) => {
              setOperator(event.target.value as PredicateCompoundOperator)
            }}
          />
          Should match ALL conditions
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="predicate"
            value="or"
            checked={operator === 'or'}
            onChange={(event) => {
              setOperator(event.target.value as PredicateCompoundOperator)
            }}
          />
          Should match ANY conditions
        </label>
      </div>
      {predicates.map((predicate, index) => (
        <div className="flex flex-col gap-2.5" key={index}>
          <div className="flex w-full flex-col gap-2 md:flex-row md:items-center">
            {index !== 0 && <div className="mr-2 text-sm font-semibold">{operator === 'and' ? 'AND' : 'OR'}</div>}
            <select
              className="flex-grow rounded border border-border bg-default px-2 py-1.5 focus:outline focus:outline-1 focus:outline-info"
              value={predicate.keypath}
              onChange={(event) => {
                changePredicateKeypath(index, event.target.value as PredicateKeypath)
              }}
            >
              {Object.entries(PredicateKeypathLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <select
              className="rounded border border-border bg-default px-2 py-1.5 focus:outline focus:outline-1 focus:outline-info"
              value={predicate.operator}
              onChange={(event) => {
                setPredicate(index, { operator: event.target.value as PredicateOperator })
              }}
            >
              {AllNonCompoundPredicateOperators.map((operator) => (
                <option key={operator} value={operator}>
                  {operator}
                </option>
              ))}
            </select>
            {predicate.keypath && (
              <PredicateValue
                keypath={predicate.keypath as PredicateKeypath}
                value={typeof predicate.value !== 'string' ? JSON.stringify(predicate.value) : predicate.value}
                setValue={(value: string) => {
                  setPredicate(index, { value })
                }}
              />
            )}
            {index !== 0 && (
              <button
                className="rounded border border-border p-1 text-danger"
                aria-label="Remove condition"
                onClick={() => {
                  removePredicate(index)
                }}
              >
                <Icon type="trash" />
              </button>
            )}
          </div>
          {index === predicates.length - 1 && (
            <Button
              className="flex items-center gap-2"
              onClick={() => {
                addPredicate()
              }}
            >
              Add another condition
            </Button>
          )}
        </div>
      ))}
      {predicates.some((predicate) => PredicateKeypathTypes[predicate.keypath as PredicateKeypath] === 'date') && (
        <div className="flex flex-col gap-2 rounded-md border-2 border-info-backdrop bg-info-backdrop px-4 py-3 [&_code]:rounded [&_code]:bg-default [&_code]:px-1.5 [&_code]:py-1">
          <div className="text-sm font-semibold">Date Examples:</div>
          <ul className="space-y-2 pl-4">
            <li>
              To get all the items modified within the last 7 days, you can use <code>User Modified Date</code>{' '}
              <code>&gt;</code> <code>7.days.ago</code>
            </li>
            <li>
              To get all the items created before June 2022, you can use <code>Created At</code> <code>&lt;</code>{' '}
              <code>06/01/2022</code>
            </li>
          </ul>
        </div>
      )}
    </>
  )
}

export default observer(CompoundPredicateBuilder)

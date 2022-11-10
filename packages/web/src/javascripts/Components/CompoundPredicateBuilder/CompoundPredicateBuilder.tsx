import { PredicateCompoundOperator, PredicateOperator } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import Button from '../Button/Button'
import Icon from '../Icon/Icon'
import { NonCompoundPredicateOperators } from '../Preferences/Panes/General/SmartViews/NonCompoundPredicateOperators'
import { CompoundPredicateBuilderController } from './CompoundPredicateBuilderState'

type Props = {
  controller: CompoundPredicateBuilderController
}

const CompoundPredicateBuilder = ({ controller }: Props) => {
  const { operator, setOperator, predicates, setPredicate, addPredicate, removePredicate } = controller

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
          <div className="flex w-full items-center gap-2">
            {index !== 0 && <div className="mr-2 text-sm font-semibold">{operator === 'and' ? 'AND' : 'OR'}</div>}
            <input
              className="flex-grow rounded border border-border py-1 px-2"
              value={predicate.keypath}
              onChange={(event) => {
                setPredicate(index, { keypath: event.target.value })
              }}
            />
            <select
              className="rounded border border-border bg-default py-1.5 px-2 focus:outline focus:outline-1 focus:outline-info"
              value={predicate.operator}
              onChange={(event) => {
                setPredicate(index, { operator: event.target.value as PredicateOperator })
              }}
            >
              {NonCompoundPredicateOperators.map((operator) => (
                <option key={operator} value={operator}>
                  {operator}
                </option>
              ))}
            </select>
            <input
              className="flex-grow rounded border border-border py-1 px-2"
              value={predicate.value.toString()}
              onChange={(event) => {
                setPredicate(index, { value: event.target.value })
              }}
            />
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
    </>
  )
}

export default observer(CompoundPredicateBuilder)

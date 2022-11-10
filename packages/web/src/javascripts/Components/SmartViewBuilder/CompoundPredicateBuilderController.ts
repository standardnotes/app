import { PredicateCompoundOperator, PredicateJsonForm } from '@standardnotes/snjs'
import { makeObservable, observable, action } from 'mobx'

const getEmptyPredicate = (): PredicateJsonForm => {
  return {
    keypath: '',
    operator: '!=',
    value: '',
  }
}

export class CompoundPredicateBuilderController {
  operator: PredicateCompoundOperator = 'and'
  predicates: PredicateJsonForm[] = [getEmptyPredicate()]

  constructor() {
    makeObservable(this, {
      operator: observable,
      setOperator: action,

      predicates: observable,
      setPredicate: action,
      addPredicate: action,
      removePredicate: action,
    })
  }

  setOperator = (operator: PredicateCompoundOperator) => {
    this.operator = operator
  }

  setPredicate = (index: number, predicate: Partial<PredicateJsonForm>) => {
    const predicateAtIndex = this.predicates[index]
    this.predicates[index] = {
      ...predicateAtIndex,
      ...predicate,
    }
  }

  addPredicate = () => {
    this.predicates.push(getEmptyPredicate())
  }

  removePredicate = (index: number) => {
    this.predicates.splice(index, 1)
  }

  toJson(): PredicateJsonForm {
    return {
      operator: this.operator,
      value: this.predicates,
    }
  }
}

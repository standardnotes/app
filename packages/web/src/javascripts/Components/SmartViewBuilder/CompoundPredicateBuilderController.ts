import { NativeFeatureIdentifier } from '@standardnotes/features'
import { NoteType, PredicateCompoundOperator, PredicateJsonForm } from '@standardnotes/snjs'
import { makeObservable, observable, action } from 'mobx'
import { PredicateKeypath, PredicateKeypathTypes } from './PredicateKeypaths'

const getEmptyPredicate = (): PredicateJsonForm => {
  return {
    keypath: 'title',
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

  changePredicateKeypath = (index: number, keypath: string) => {
    const currentKeyPath = this.predicates[index].keypath as PredicateKeypath
    const currentKeyPathType = PredicateKeypathTypes[currentKeyPath]
    const newKeyPathType = PredicateKeypathTypes[keypath as PredicateKeypath]

    if (currentKeyPathType !== newKeyPathType) {
      switch (newKeyPathType) {
        case 'string':
          this.setPredicate(index, { value: '' })
          break
        case 'boolean':
          this.setPredicate(index, { value: true })
          break
        case 'number':
          this.setPredicate(index, { value: 0 })
          break
        case 'noteType':
          this.setPredicate(index, { value: Object.values(NoteType)[0] })
          break
        case 'editorIdentifier':
          this.setPredicate(index, { value: NativeFeatureIdentifier.TYPES.PlainEditor })
          break
        case 'date':
          this.setPredicate(index, { value: '1.days.ago' })
          break
      }
    }

    this.setPredicate(index, { keypath })
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

  resetState() {
    this.operator = 'and'
    this.predicates = [getEmptyPredicate()]
  }
}

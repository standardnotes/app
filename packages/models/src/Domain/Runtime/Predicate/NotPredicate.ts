import { PredicateTarget, PredicateInterface, PredicateJsonForm } from './Interface'

export class NotPredicate<T extends PredicateTarget> implements PredicateInterface<T> {
  constructor(public readonly predicate: PredicateInterface<T>) {}

  matchesItem(item: T): boolean {
    return !this.predicate.matchesItem(item)
  }

  keypathIncludesString(verb: string): boolean {
    return this.predicate.keypathIncludesString(verb)
  }

  toJson(): PredicateJsonForm {
    return {
      operator: 'not',
      value: this.predicate.toJson(),
    }
  }
}

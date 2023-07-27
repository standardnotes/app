import { PredicateTarget, PredicateInterface, PredicateJsonForm, StringKey } from './Interface'

export class IncludesPredicate<T extends PredicateTarget> implements PredicateInterface<T> {
  constructor(
    private readonly keypath: StringKey<T>,
    public readonly predicate: PredicateInterface<T>,
  ) {}

  matchesItem(item: T): boolean {
    const keyPathComponents = this.keypath.split('.') as StringKey<T>[]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const valueAtKeyPath: T = keyPathComponents.reduce<any>((previous, current) => {
      return previous && previous[current]
    }, item)

    if (!Array.isArray(valueAtKeyPath)) {
      return false
    }

    return valueAtKeyPath.some((subItem) => this.predicate.matchesItem(subItem))
  }

  keypathIncludesString(verb: string): boolean {
    return this.keypath.includes(verb)
  }

  toJson(): PredicateJsonForm {
    return {
      keypath: this.keypath,
      operator: 'includes',
      value: this.predicate.toJson(),
    }
  }
}

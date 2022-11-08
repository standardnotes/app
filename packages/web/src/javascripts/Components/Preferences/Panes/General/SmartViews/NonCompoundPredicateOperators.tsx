import { AllPredicateOperators } from '@standardnotes/snjs'

export const NonCompoundPredicateOperators = AllPredicateOperators.filter(
  (operator) => operator !== 'and' && operator !== 'or',
)

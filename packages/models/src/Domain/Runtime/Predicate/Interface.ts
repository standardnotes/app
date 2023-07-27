export interface PredicateInterface<T> {
  matchesItem(item: T): boolean
  keypathIncludesString(verb: string): boolean
  toJson(): PredicateJsonForm
}

export type RawPredicateInArrayForm = string[]

export interface PredicateJsonForm {
  keypath?: string
  operator: PredicateOperator
  value: SureValue | PredicateJsonForm | PredicateJsonForm[] | RawPredicateInArrayForm
}

export const AllPredicateCompoundOperators = ['and', 'or'] as const
export type PredicateCompoundOperator = (typeof AllPredicateCompoundOperators)[number]

export const AllNonCompoundPredicateOperators = [
  '!=',
  '=',
  '<',
  '>',
  '<=',
  '>=',
  'startsWith',
  'in',
  'matches',
  'not',
  'includes',
] as const

export const AllPredicateOperators = [...AllPredicateCompoundOperators, ...AllNonCompoundPredicateOperators] as const

export type PredicateOperator = (typeof AllPredicateOperators)[number]

export type SureValue = number | number[] | string[] | string | Date | boolean | false | ''

export const SureValueNonObjectTypesAsStrings = ['number', 'string', 'boolean']

export type FalseyValue = false | '' | null | undefined

export type PrimitiveOperand = SureValue | FalseyValue

export type PredicateTarget = unknown

export type StringKey<T = unknown> = keyof T & string

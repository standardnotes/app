import { CompoundPredicate } from './CompoundPredicate'
import { IncludesPredicate } from './IncludesPredicate'
import {
  AllPredicateCompoundOperators,
  PredicateCompoundOperator,
  PredicateInterface,
  PredicateOperator,
  SureValue,
  PredicateJsonForm,
  AllPredicateOperators,
  RawPredicateInArrayForm,
  SureValueNonObjectTypesAsStrings,
  StringKey,
  PredicateTarget,
} from './Interface'
import { NotPredicate } from './NotPredicate'
import { Predicate } from './Predicate'

export function predicateFromArguments<T extends PredicateTarget>(
  keypath: StringKey<T> | undefined,
  operator: PredicateOperator,
  value: SureValue | PredicateJsonForm,
): PredicateInterface<T> {
  if (AllPredicateCompoundOperators.includes(operator as PredicateCompoundOperator)) {
    return compoundPredicateFromArguments(operator, value as unknown as PredicateJsonForm[])
  } else if (operator === 'not') {
    return new NotPredicate(predicateFromJson(value as PredicateJsonForm))
  } else if (operator === 'includes' && keypath) {
    if (isSureValue(value)) {
      return new Predicate(keypath, operator, value)
    } else {
      return new IncludesPredicate(keypath, predicateFromJson(value as PredicateJsonForm))
    }
  } else if (keypath) {
    return new Predicate(keypath, operator, value as SureValue)
  }

  throw Error('Invalid predicate arguments')
}

export function compoundPredicateFromArguments<T extends PredicateTarget>(
  operator: PredicateOperator,
  value: PredicateJsonForm[],
): PredicateInterface<T> {
  const subPredicates = value.map((jsonPredicate) => {
    return predicateFromJson(jsonPredicate)
  })
  return new CompoundPredicate(operator as PredicateCompoundOperator, subPredicates)
}

export function notPredicateFromArguments<T extends PredicateTarget>(value: PredicateJsonForm): PredicateInterface<T> {
  const subPredicate = predicateFromJson(value)
  return new NotPredicate(subPredicate)
}

export function includesPredicateFromArguments<T extends PredicateTarget>(
  keypath: StringKey<T>,
  value: PredicateJsonForm,
): PredicateInterface<T> {
  const subPredicate = predicateFromJson(value)
  return new IncludesPredicate<T>(keypath, subPredicate)
}

export function predicateFromJson<T extends PredicateTarget>(values: PredicateJsonForm): PredicateInterface<T> {
  if (Array.isArray(values)) {
    throw Error('Invalid predicateFromJson value')
  }
  return predicateFromArguments(
    values.keypath as StringKey<T>,
    values.operator,
    isValuePredicateInArrayForm(values.value)
      ? predicateDSLArrayToJsonPredicate(values.value)
      : (values.value as PredicateJsonForm),
  )
}

export function predicateFromDSLString<T extends PredicateTarget>(dsl: string): PredicateInterface<T> {
  try {
    const components = JSON.parse(dsl.substring(1, dsl.length)) as string[]
    components.shift()
    const predicateJson = predicateDSLArrayToJsonPredicate(components as RawPredicateInArrayForm)
    return predicateFromJson(predicateJson)
  } catch (e) {
    throw Error(`Invalid smart view syntax ${JSON.stringify(e)}`)
  }
}

function isValuePredicateInArrayForm(
  value: SureValue | PredicateJsonForm | PredicateJsonForm[] | RawPredicateInArrayForm,
): value is RawPredicateInArrayForm {
  return Array.isArray(value) && AllPredicateOperators.includes(value[1] as PredicateOperator)
}

function isSureValue(value: unknown): value is SureValue {
  if (SureValueNonObjectTypesAsStrings.includes(typeof value)) {
    return true
  }

  if (Array.isArray(value)) {
    return !isValuePredicateInArrayForm(value)
  }

  return false
}

function predicateDSLArrayToJsonPredicate(predicateArray: RawPredicateInArrayForm): PredicateJsonForm {
  const predicateValue = predicateArray[2] as
    | SureValue
    | SureValue[]
    | RawPredicateInArrayForm
    | RawPredicateInArrayForm[]

  let resolvedPredicateValue: PredicateJsonForm | SureValue | PredicateJsonForm[]

  if (Array.isArray(predicateValue)) {
    const level1CondensedValue = predicateValue as SureValue[] | RawPredicateInArrayForm | RawPredicateInArrayForm[]

    if (Array.isArray(level1CondensedValue[0])) {
      const level2CondensedValue = level1CondensedValue as RawPredicateInArrayForm[]
      resolvedPredicateValue = level2CondensedValue.map((subPredicate) =>
        predicateDSLArrayToJsonPredicate(subPredicate),
      )
    } else if (isValuePredicateInArrayForm(predicateValue[1])) {
      const level2CondensedValue = level1CondensedValue as RawPredicateInArrayForm
      resolvedPredicateValue = predicateDSLArrayToJsonPredicate(level2CondensedValue)
    } else {
      const level2CondensedValue = predicateValue as SureValue
      resolvedPredicateValue = level2CondensedValue
    }
  } else {
    const level1CondensedValue = predicateValue as SureValue
    resolvedPredicateValue = level1CondensedValue
  }

  return {
    keypath: predicateArray[0],
    operator: predicateArray[1] as PredicateOperator,
    value: resolvedPredicateValue,
  }
}

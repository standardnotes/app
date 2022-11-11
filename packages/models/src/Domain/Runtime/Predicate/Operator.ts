import { isString } from '@standardnotes/utils'
import { FalseyValue, PredicateOperator, PrimitiveOperand, SureValue } from './Interface'
import { dateFromDSLDateString } from './Utils'

export function valueMatchesTargetValue(
  value: PrimitiveOperand,
  operator: PredicateOperator,
  targetValue: SureValue,
): boolean {
  if (targetValue == undefined) {
    return false
  }

  if (typeof targetValue === 'string' && targetValue.includes('.ago')) {
    targetValue = dateFromDSLDateString(targetValue)
  }

  if (typeof targetValue === 'string') {
    targetValue = targetValue.toLowerCase()
  }

  if (typeof value === 'string') {
    value = value.toLowerCase()
  }

  if (value instanceof Date && typeof targetValue === 'string') {
    targetValue = new Date(targetValue)
  }

  if (operator === 'not') {
    return !valueMatchesTargetValue(value, '=', targetValue)
  }

  const falseyValues = [false, '', null, undefined, NaN]
  if (value == undefined) {
    const isExpectingFalseyValue = falseyValues.includes(targetValue as FalseyValue)
    if (operator === '!=') {
      return !isExpectingFalseyValue
    } else {
      return isExpectingFalseyValue
    }
  }

  if (operator === '=') {
    if (Array.isArray(value)) {
      return JSON.stringify(value) === JSON.stringify(targetValue)
    } else {
      return value === targetValue
    }
  }

  if (operator === '!=') {
    if (Array.isArray(value)) {
      return JSON.stringify(value) !== JSON.stringify(targetValue)
    } else {
      return value !== targetValue
    }
  }

  if (operator === '<') {
    return (value as number) < (targetValue as number)
  }

  if (operator === '>') {
    return (value as number) > (targetValue as number)
  }

  if (operator === '<=') {
    return (value as number) <= (targetValue as number)
  }

  if (operator === '>=') {
    return (value as number) >= (targetValue as number)
  }

  if (operator === 'startsWith') {
    return (value as string).startsWith(targetValue as string)
  }

  if (operator === 'in' && Array.isArray(targetValue)) {
    return (targetValue as SureValue[]).includes(value)
  }

  if (operator === 'includes') {
    if (isString(value)) {
      return value.includes(targetValue as string)
    }

    if (isString(targetValue) && (isString(value) || Array.isArray(value))) {
      return (value as SureValue[]).includes(targetValue)
    }
  }

  if (operator === 'matches') {
    const regex = new RegExp(targetValue as string)
    return regex.test(value as string)
  }
  return false
}

import { UnprotectedAccessSecondsDuration } from './UnprotectedAccessSecondsDuration'

export function isValidProtectionSessionLength(number: unknown): boolean {
  return typeof number === 'number' && Object.values(UnprotectedAccessSecondsDuration).includes(number)
}

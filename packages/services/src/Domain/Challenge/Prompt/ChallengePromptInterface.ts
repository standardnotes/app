import { ChallengeKeyboardType } from '../Types/ChallengeKeyboardType'
import { ChallengeRawValue } from '../Types/ChallengeRawValue'
import { ChallengeValidation } from '../Types/ChallengeValidation'

/**
 * A Challenge can have many prompts. Each prompt represents a unique input,
 * such as a text field, or biometric scanner.
 */
export interface ChallengePromptInterface {
  readonly id: number
  readonly placeholder: string
  readonly title: string
  readonly validates: boolean

  readonly validation: ChallengeValidation
  readonly secureTextEntry: boolean
  readonly keyboardType?: ChallengeKeyboardType
  readonly initialValue?: ChallengeRawValue
}

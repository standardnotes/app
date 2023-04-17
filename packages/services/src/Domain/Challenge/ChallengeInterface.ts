import { ChallengePromptInterface } from './Prompt/ChallengePromptInterface'
import { ChallengeReason } from './Types/ChallengeReason'
import { ChallengeValidation } from './Types/ChallengeValidation'
import { ChallengeValue } from './Types/ChallengeValue'

export interface ChallengeInterface {
  readonly id: number
  readonly prompts: ChallengePromptInterface[]
  readonly reason: ChallengeReason
  readonly cancelable: boolean

  customHandler?: (challenge: ChallengeInterface, values: ChallengeValue[]) => Promise<void>

  /** Outside of the modal, this is the title of the modal itself */
  get modalTitle(): string

  /** Inside of the modal, this is the H1 */
  get heading(): string | undefined

  /** Inside of the modal, this is the H2 */
  get subheading(): string | undefined

  hasPromptForValidationType(type: ChallengeValidation): boolean
}

import { ChallengeResponseInterface } from '../ChallengeResponseInterface'
import { ChallengeValueCallback } from './ChallengeValueCallback'

export type ChallengeObserver = {
  onValidValue?: ChallengeValueCallback
  onInvalidValue?: ChallengeValueCallback
  onNonvalidatedSubmit?: (response: ChallengeResponseInterface) => void
  onComplete?: (response: ChallengeResponseInterface) => void
  onCancel?: () => void
}

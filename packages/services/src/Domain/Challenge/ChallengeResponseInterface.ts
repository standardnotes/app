import { ChallengeInterface } from './ChallengeInterface'
import { ChallengeArtifacts } from './Types/ChallengeArtifacts'
import { ChallengeValidation } from './Types/ChallengeValidation'
import { ChallengeValue } from './Types/ChallengeValue'

export interface ChallengeResponseInterface {
  readonly challenge: ChallengeInterface
  readonly values: ChallengeValue[]
  readonly artifacts?: ChallengeArtifacts

  getValueForType(type: ChallengeValidation): ChallengeValue
  getDefaultValue(): ChallengeValue
}

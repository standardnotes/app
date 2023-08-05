import { ChallengeArtifacts } from './Types/ChallengeArtifacts'
import { ChallengeValue } from './Types/ChallengeValue'
import { RootKeyInterface } from '@standardnotes/models'

import { AbstractService } from '../Service/AbstractService'
import { ChallengeInterface } from './ChallengeInterface'
import { ChallengePromptInterface } from './Prompt/ChallengePromptInterface'
import { ChallengeResponseInterface } from './ChallengeResponseInterface'
import { ChallengeReason } from './Types/ChallengeReason'
import { ChallengeObserver } from './Types/ChallengeObserver'

export interface ChallengeServiceInterface extends AbstractService {
  sendChallenge: (challenge: ChallengeInterface) => void
  submitValuesForChallenge(challenge: ChallengeInterface, values: ChallengeValue[]): Promise<void>
  cancelChallenge(challenge: ChallengeInterface): void

  /**
   * Resolves when the challenge has been completed.
   * For non-validated challenges, will resolve when the first value is submitted.
   */
  promptForChallengeResponse(challenge: ChallengeInterface): Promise<ChallengeResponseInterface | undefined>
  createChallenge(
    prompts: ChallengePromptInterface[],
    reason: ChallengeReason,
    cancelable: boolean,
    heading?: string,
    subheading?: string,
  ): ChallengeInterface
  completeChallenge(challenge: ChallengeInterface): void
  promptForAccountPassword(): Promise<string | null>
  getWrappingKeyIfApplicable(passcode?: string): Promise<
    | {
        canceled?: undefined
        wrappingKey?: undefined
      }
    | {
        canceled: boolean
        wrappingKey?: undefined
      }
    | {
        wrappingKey: RootKeyInterface
        canceled?: undefined
      }
  >
  addChallengeObserver(challenge: ChallengeInterface, observer: ChallengeObserver): () => void
  setValidationStatusForChallenge(
    challenge: ChallengeInterface,
    value: ChallengeValue,
    valid: boolean,
    artifacts?: ChallengeArtifacts,
  ): void
}

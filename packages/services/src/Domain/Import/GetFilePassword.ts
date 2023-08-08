import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import {
  Challenge,
  ChallengePrompt,
  ChallengeReason,
  ChallengeServiceInterface,
  ChallengeValidation,
} from '../Challenge'
import { Strings } from './Strings'

export class GetFilePassword implements UseCaseInterface<string> {
  constructor(private challenges: ChallengeServiceInterface) {}

  async execute(): Promise<Result<string>> {
    const challenge = new Challenge(
      [new ChallengePrompt(ChallengeValidation.None, Strings.FileAccountPassword, undefined, true)],
      ChallengeReason.DecryptEncryptedFile,
      true,
    )

    const passwordResponse = await this.challenges.promptForChallengeResponse(challenge)
    if (passwordResponse == undefined) {
      return Result.fail('Import aborted due to canceled password prompt')
    }

    this.challenges.completeChallenge(challenge)
    return Result.ok(passwordResponse?.values[0].value as string)
  }
}

import { MigrationServices } from './MigrationServices'
import {
  ApplicationStage,
  ChallengeValidation,
  ChallengeReason,
  ChallengePrompt,
  Challenge,
} from '@standardnotes/services'

type StageHandler = () => Promise<void>

export abstract class Migration {
  private stageHandlers: Partial<Record<ApplicationStage, StageHandler>> = {}
  private onDoneHandler?: () => void

  constructor(protected services: MigrationServices) {
    this.registerStageHandlers()
  }

  public static version(): string {
    throw 'Must override migration version'
  }

  protected abstract registerStageHandlers(): void

  protected registerStageHandler(stage: ApplicationStage, handler: StageHandler) {
    this.stageHandlers[stage] = handler
  }

  protected markDone() {
    this.onDoneHandler?.()
    this.onDoneHandler = undefined
  }

  protected async promptForPasscodeUntilCorrect(validationCallback: (passcode: string) => Promise<boolean>) {
    const challenge = new Challenge([new ChallengePrompt(ChallengeValidation.None)], ChallengeReason.Migration, false)
    return new Promise((resolve) => {
      this.services.challengeService.addChallengeObserver(challenge, {
        onNonvalidatedSubmit: async (challengeResponse) => {
          const value = challengeResponse.values[0]
          const passcode = value.value as string
          const valid = await validationCallback(passcode)
          if (valid) {
            this.services.challengeService.completeChallenge(challenge)
            resolve(passcode)
          } else {
            this.services.challengeService.setValidationStatusForChallenge(challenge, value, false)
          }
        },
      })
      void this.services.challengeService.promptForChallengeResponse(challenge)
    })
  }

  onDone(callback: () => void) {
    this.onDoneHandler = callback
  }

  async handleStage(stage: ApplicationStage): Promise<void> {
    const handler = this.stageHandlers[stage]
    if (handler) {
      await handler()
    }
  }
}

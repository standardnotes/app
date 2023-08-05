import { RootKeyInterface } from '@standardnotes/models'
import { DiskStorageService } from '../Storage/DiskStorageService'
import { removeFromArray } from '@standardnotes/utils'
import { isValidProtectionSessionLength } from '../Protection/isValidProtectionSessionLength'
import {
  AbstractService,
  ChallengeServiceInterface,
  InternalEventBusInterface,
  Challenge,
  ChallengeArtifacts,
  ChallengeReason,
  ChallengeValidation,
  ChallengeValue,
  ChallengeInterface,
  ChallengePromptInterface,
  ChallengePrompt,
  EncryptionService,
  ChallengeStrings,
  ChallengeObserver,
} from '@standardnotes/services'
import { ChallengeResponse } from './ChallengeResponse'
import { ChallengeOperation } from './ChallengeOperation'

type ChallengeValidationResponse = {
  valid: boolean
  artifacts?: ChallengeArtifacts
}

const clearChallengeObserver = (observer: ChallengeObserver) => {
  observer.onCancel = undefined
  observer.onComplete = undefined
  observer.onValidValue = undefined
  observer.onInvalidValue = undefined
  observer.onNonvalidatedSubmit = undefined
}

/**
 * The challenge service creates, updates and keeps track of running challenge operations.
 */
export class ChallengeService extends AbstractService implements ChallengeServiceInterface {
  private challengeOperations: Record<string, ChallengeOperation> = {}
  public sendChallenge!: (challenge: Challenge) => void
  private challengeObservers: Record<string, ChallengeObserver[]> = {}

  constructor(
    private storageService: DiskStorageService,
    private encryptionService: EncryptionService,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
  }

  public override deinit() {
    ;(this.storageService as unknown) = undefined
    ;(this.encryptionService as unknown) = undefined
    ;(this.sendChallenge as unknown) = undefined
    ;(this.challengeOperations as unknown) = undefined
    ;(this.challengeObservers as unknown) = undefined
    super.deinit()
  }

  public promptForChallengeResponse(challenge: Challenge): Promise<ChallengeResponse | undefined> {
    return new Promise<ChallengeResponse | undefined>((resolve) => {
      this.createOrGetChallengeOperation(challenge, resolve)
      this.sendChallenge(challenge)
    })
  }

  public createChallenge(
    prompts: ChallengePromptInterface[],
    reason: ChallengeReason,
    cancelable: boolean,
    heading?: string,
    subheading?: string,
  ): ChallengeInterface {
    return new Challenge(prompts, reason, cancelable, heading, subheading)
  }

  public async validateChallengeValue(value: ChallengeValue): Promise<ChallengeValidationResponse> {
    switch (value.prompt.validation) {
      case ChallengeValidation.LocalPasscode:
        return this.encryptionService.validatePasscode(value.value as string)
      case ChallengeValidation.AccountPassword:
        return this.encryptionService.validateAccountPassword(value.value as string)
      case ChallengeValidation.Biometric:
        return { valid: value.value === true }
      case ChallengeValidation.Authenticator:
        return { valid: 'id' in (value.value as Record<string, unknown>) }
      case ChallengeValidation.ProtectionSessionDuration:
        return { valid: isValidProtectionSessionLength(value.value) }
      default:
        throw Error(`Unhandled validation mode ${value.prompt.validation}`)
    }
  }

  public async promptForCorrectPasscode(reason: ChallengeReason): Promise<string | undefined> {
    const challenge = new Challenge([new ChallengePrompt(ChallengeValidation.LocalPasscode)], reason, true)
    const response = await this.promptForChallengeResponse(challenge)
    if (!response) {
      return undefined
    }
    const value = response.getValueForType(ChallengeValidation.LocalPasscode)
    return value.value as string
  }

  async promptForAccountPassword(): Promise<string | null> {
    if (!this.encryptionService.hasAccount()) {
      throw Error('Requiring account password for challenge with no account')
    }

    const response = await this.promptForChallengeResponse(
      new Challenge(
        [new ChallengePrompt(ChallengeValidation.AccountPassword)],
        ChallengeReason.Custom,
        true,
        ChallengeStrings.EnterAccountPassword,
      ),
    )

    return response?.getValueForType(ChallengeValidation.AccountPassword)?.value as string
  }

  /**
   * Returns the wrapping key for operations that require resaving the root key
   * (changing the account password, signing in, registering, or upgrading protocol)
   * Returns empty object if no passcode is configured.
   * Otherwise returns {cancled: true} if the operation is canceled, or
   * {wrappingKey} with the result.
   * @param passcode - If the consumer already has access to the passcode,
   * they can pass it here so that the user is not prompted again.
   */
  async getWrappingKeyIfApplicable(passcode?: string): Promise<
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
  > {
    if (!this.encryptionService.hasPasscode()) {
      return {}
    }

    if (!passcode) {
      passcode = await this.promptForCorrectPasscode(ChallengeReason.ResaveRootKey)
      if (!passcode) {
        return { canceled: true }
      }
    }

    const wrappingKey = await this.encryptionService.computeWrappingKey(passcode)
    return { wrappingKey }
  }

  public addChallengeObserver(challenge: Challenge, observer: ChallengeObserver): () => void {
    const observers = this.challengeObservers[challenge.id] || []

    observers.push(observer)

    this.challengeObservers[challenge.id] = observers

    return () => {
      clearChallengeObserver(observer)

      removeFromArray(observers, observer)
    }
  }

  private createOrGetChallengeOperation(
    challenge: Challenge,
    resolve: (response: ChallengeResponse | undefined) => void,
  ): ChallengeOperation {
    let operation = this.getChallengeOperation(challenge)

    if (!operation) {
      operation = new ChallengeOperation(
        challenge,
        (value: ChallengeValue) => {
          this.onChallengeValidValue(challenge, value)
        },
        (value: ChallengeValue) => {
          this.onChallengeInvalidValue(challenge, value)
        },
        (response: ChallengeResponse) => {
          this.onChallengeNonvalidatedSubmit(challenge, response)
          resolve(response)
        },
        (response: ChallengeResponse) => {
          this.onChallengeComplete(challenge, response)
          resolve(response)
        },
        () => {
          this.onChallengeCancel(challenge)
          resolve(undefined)
        },
      )

      this.challengeOperations[challenge.id] = operation
    }
    return operation
  }

  private performOnObservers(challenge: Challenge, perform: (observer: ChallengeObserver) => void) {
    const observers = this.challengeObservers[challenge.id] || []

    for (const observer of observers) {
      perform(observer)
    }
  }

  private onChallengeValidValue(challenge: Challenge, value: ChallengeValue) {
    this.performOnObservers(challenge, (observer) => {
      observer.onValidValue?.(value)
    })
  }

  private onChallengeInvalidValue(challenge: Challenge, value: ChallengeValue) {
    this.performOnObservers(challenge, (observer) => {
      observer.onInvalidValue?.(value)
    })
  }

  private onChallengeNonvalidatedSubmit(challenge: Challenge, response: ChallengeResponse) {
    this.performOnObservers(challenge, (observer) => {
      observer.onNonvalidatedSubmit?.(response)
    })
  }

  private onChallengeComplete(challenge: Challenge, response: ChallengeResponse) {
    this.performOnObservers(challenge, (observer) => {
      observer.onComplete?.(response)
    })
  }

  private onChallengeCancel(challenge: Challenge) {
    this.performOnObservers(challenge, (observer) => {
      observer.onCancel?.()
    })
  }

  private getChallengeOperation(challenge: Challenge) {
    return this.challengeOperations[challenge.id]
  }

  private deleteChallengeOperation(operation: ChallengeOperation) {
    const challenge = operation.challenge
    challenge.customHandler = undefined
    operation.deinit()

    delete this.challengeOperations[challenge.id]
  }

  public cancelChallenge(challenge: Challenge): void {
    const operation = this.challengeOperations[challenge.id]
    operation.cancel()

    this.deleteChallengeOperation(operation)
  }

  public completeChallenge(challenge: Challenge): void {
    const operation = this.challengeOperations[challenge.id]
    operation.complete()

    this.deleteChallengeOperation(operation)
  }

  public async submitValuesForChallenge(challenge: Challenge, values: ChallengeValue[]): Promise<void> {
    if (values.length === 0) {
      throw Error('Attempting to submit 0 values for challenge')
    }

    for (const value of values) {
      if (!value.prompt.validates) {
        const operation = this.getChallengeOperation(challenge)
        operation.addNonvalidatedValue(value)
      } else {
        const { valid, artifacts } = await this.validateChallengeValue(value)
        this.setValidationStatusForChallenge(challenge, value, valid, artifacts)
      }
    }
  }

  public setValidationStatusForChallenge(
    challenge: ChallengeInterface,
    value: ChallengeValue,
    valid: boolean,
    artifacts?: ChallengeArtifacts,
  ): void {
    const operation = this.getChallengeOperation(challenge)
    operation.setValueStatus(value, valid, artifacts)

    if (operation.isFinished()) {
      this.deleteChallengeOperation(operation)

      const observers = this.challengeObservers[challenge.id] || []
      observers.forEach(clearChallengeObserver)
      observers.length = 0

      delete this.challengeObservers[challenge.id]
    }
  }
}

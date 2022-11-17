import { EncryptionProviderInterface, SNRootKey, SNRootKeyParams } from '@standardnotes/encryption'
import { HttpResponse, SignInResponse, User } from '@standardnotes/responses'
import { KeyParamsOrigination, UserRequestType } from '@standardnotes/common'
import { UuidGenerator } from '@standardnotes/utils'
import { UserApiServiceInterface, UserRegistrationResponseBody } from '@standardnotes/api'

import * as Messages from '../Strings/Messages'
import { InfoStrings } from '../Strings/InfoStrings'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { StorageServiceInterface } from '../Storage/StorageServiceInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { AlertService } from '../Alert/AlertService'
import {
  Challenge,
  ChallengePrompt,
  ChallengeReason,
  ChallengeServiceInterface,
  ChallengeValidation,
} from '../Challenge'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { AbstractService } from '../Service/AbstractService'
import { UserClientInterface } from './UserClientInterface'
import { DeinitSource } from '../Application/DeinitSource'
import { StoragePersistencePolicies } from '../Storage/StorageTypes'
import { SessionsClientInterface } from '../Session/SessionsClientInterface'
import { ProtectionsClientInterface } from '../Protection/ProtectionClientInterface'

export type CredentialsChangeFunctionResponse = { error?: { message: string } }
export type AccountServiceResponse = HttpResponse

export enum AccountEvent {
  SignedInOrRegistered = 'SignedInOrRegistered',
  SignedOut = 'SignedOut',
}

type AccountEventData = {
  source: DeinitSource
}

export class UserService extends AbstractService<AccountEvent, AccountEventData> implements UserClientInterface {
  private signingIn = false
  private registering = false

  private readonly MINIMUM_PASSCODE_LENGTH = 1
  private readonly MINIMUM_PASSWORD_LENGTH = 8

  constructor(
    private sessionManager: SessionsClientInterface,
    private syncService: SyncServiceInterface,
    private storageService: StorageServiceInterface,
    private itemManager: ItemManagerInterface,
    private protocolService: EncryptionProviderInterface,
    private alertService: AlertService,
    private challengeService: ChallengeServiceInterface,
    private protectionService: ProtectionsClientInterface,
    private userApiService: UserApiServiceInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
  }

  public override deinit(): void {
    super.deinit()
    ;(this.sessionManager as unknown) = undefined
    ;(this.syncService as unknown) = undefined
    ;(this.storageService as unknown) = undefined
    ;(this.itemManager as unknown) = undefined
    ;(this.protocolService as unknown) = undefined
    ;(this.alertService as unknown) = undefined
    ;(this.challengeService as unknown) = undefined
    ;(this.protectionService as unknown) = undefined
    ;(this.userApiService as unknown) = undefined
  }

  /**
   *  @param mergeLocal  Whether to merge existing offline data into account. If false,
   *                     any pre-existing data will be fully deleted upon success.
   */
  public async register(
    email: string,
    password: string,
    ephemeral = false,
    mergeLocal = true,
  ): Promise<UserRegistrationResponseBody> {
    if (this.protocolService.hasAccount()) {
      throw Error('Tried to register when an account already exists.')
    }

    if (this.registering) {
      throw Error('Already registering.')
    }

    this.registering = true

    try {
      this.lockSyncing()
      const response = await this.sessionManager.register(email, password, ephemeral)

      this.syncService.resetSyncState()

      await this.storageService.setPersistencePolicy(
        ephemeral ? StoragePersistencePolicies.Ephemeral : StoragePersistencePolicies.Default,
      )

      if (mergeLocal) {
        await this.syncService.markAllItemsAsNeedingSyncAndPersist()
      } else {
        await this.itemManager.removeAllItemsFromMemory()
        await this.clearDatabase()
      }

      await this.notifyEvent(AccountEvent.SignedInOrRegistered)

      this.unlockSyncing()
      this.registering = false

      await this.syncService.downloadFirstSync(300)
      void this.protocolService.decryptErroredPayloads()

      return response
    } catch (error) {
      this.unlockSyncing()
      this.registering = false

      throw error
    }
  }

  /**
   * @param mergeLocal  Whether to merge existing offline data into account.
   * If false, any pre-existing data will be fully deleted upon success.
   */
  public async signIn(
    email: string,
    password: string,
    strict = false,
    ephemeral = false,
    mergeLocal = true,
    awaitSync = false,
  ): Promise<AccountServiceResponse> {
    if (this.protocolService.hasAccount()) {
      throw Error('Tried to sign in when an account already exists.')
    }

    if (this.signingIn) {
      throw Error('Already signing in.')
    }

    this.signingIn = true

    try {
      /** Prevent a timed sync from occuring while signing in. */
      this.lockSyncing()

      const result = await this.sessionManager.signIn(email, password, strict, ephemeral)

      if (!result.response.error) {
        this.syncService.resetSyncState()

        await this.storageService.setPersistencePolicy(
          ephemeral ? StoragePersistencePolicies.Ephemeral : StoragePersistencePolicies.Default,
        )

        if (mergeLocal) {
          await this.syncService.markAllItemsAsNeedingSyncAndPersist()
        } else {
          void this.itemManager.removeAllItemsFromMemory()
          await this.clearDatabase()
        }

        await this.notifyEvent(AccountEvent.SignedInOrRegistered)

        this.unlockSyncing()

        const syncPromise = this.syncService
          .downloadFirstSync(1_000, {
            checkIntegrity: true,
            awaitAll: awaitSync,
          })
          .then(() => {
            if (!awaitSync) {
              void this.protocolService.decryptErroredPayloads()
            }
          })

        if (awaitSync) {
          await syncPromise

          await this.protocolService.decryptErroredPayloads()
        }
      } else {
        this.unlockSyncing()
      }

      return result.response
    } finally {
      this.signingIn = false
    }
  }

  public async deleteAccount(): Promise<{
    error: boolean
    message?: string
  }> {
    if (
      !(await this.protectionService.authorizeAction(ChallengeReason.DeleteAccount, {
        fallBackToAccountPassword: true,
        requireAccountPassword: true,
        forcePrompt: false,
      }))
    ) {
      return {
        error: true,
        message: Messages.INVALID_PASSWORD,
      }
    }

    const uuid = this.sessionManager.getSureUser().uuid
    const response = await this.userApiService.deleteAccount(uuid)
    if (response.data.error) {
      return {
        error: true,
        message: response.data.error.message,
      }
    }

    await this.signOut(true)

    void this.alertService.alert(InfoStrings.AccountDeleted)

    return {
      error: false,
    }
  }

  async submitUserRequest(requestType: UserRequestType): Promise<boolean> {
    const userUuid = this.sessionManager.getSureUser().uuid
    try {
      const result = await this.userApiService.submitUserRequest({
        userUuid,
        requestType,
      })

      if (result.data.error) {
        return false
      }

      return result.data.success
    } catch (error) {
      return false
    }
  }

  /**
   * A sign in request that occurs while the user was previously signed in, to correct
   * for missing keys or storage values. Unlike regular sign in, this doesn't worry about
   * performing one of marking all items as needing sync or deleting all local data.
   */
  public async correctiveSignIn(rootKey: SNRootKey): Promise<HttpResponse | SignInResponse> {
    this.lockSyncing()

    const response = await this.sessionManager.bypassChecksAndSignInWithRootKey(
      rootKey.keyParams.identifier,
      rootKey,
      false,
    )

    if (!response.error) {
      await this.notifyEvent(AccountEvent.SignedInOrRegistered)

      this.unlockSyncing()

      void this.syncService.downloadFirstSync(1_000, {
        checkIntegrity: true,
      })

      void this.protocolService.decryptErroredPayloads()
    }

    this.unlockSyncing()

    return response
  }

  /**
   * @param passcode - Changing the account password or email requires the local
   * passcode if configured (to rewrap the account key with passcode). If the passcode
   * is not passed in, the user will be prompted for the passcode. However if the consumer
   * already has reference to the passcode, they can pass it in here so that the user
   * is not prompted again.
   */
  public async changeCredentials(parameters: {
    currentPassword: string
    origination: KeyParamsOrigination
    validateNewPasswordStrength: boolean
    newEmail?: string
    newPassword?: string
    passcode?: string
  }): Promise<CredentialsChangeFunctionResponse> {
    const result = await this.performCredentialsChange(parameters)
    if (result.error) {
      void this.alertService.alert(result.error.message)
    }
    return result
  }

  public async signOut(force = false, source = DeinitSource.SignOut): Promise<void> {
    const performSignOut = async () => {
      await this.sessionManager.signOut()
      await this.protocolService.deleteWorkspaceSpecificKeyStateFromDevice()
      await this.storageService.clearAllData()
      await this.notifyEvent(AccountEvent.SignedOut, { source })
    }

    if (force) {
      await performSignOut()

      return
    }

    const dirtyItems = this.itemManager.getDirtyItems()
    if (dirtyItems.length > 0) {
      const singular = dirtyItems.length === 1
      const didConfirm = await this.alertService.confirm(
        `There ${singular ? 'is' : 'are'} ${dirtyItems.length} ${
          singular ? 'item' : 'items'
        } with unsynced changes. If you sign out, these changes will be lost forever. Are you sure you want to sign out?`,
      )
      if (didConfirm) {
        await performSignOut()
      }
    } else {
      await performSignOut()
    }
  }

  public async performProtocolUpgrade(): Promise<{
    success?: true
    canceled?: true
    error?: { message: string }
  }> {
    const hasPasscode = this.protocolService.hasPasscode()
    const hasAccount = this.protocolService.hasAccount()
    const prompts = []
    if (hasPasscode) {
      prompts.push(
        new ChallengePrompt(
          ChallengeValidation.LocalPasscode,
          undefined,
          Messages.ChallengeStrings.LocalPasscodePlaceholder,
        ),
      )
    }
    if (hasAccount) {
      prompts.push(
        new ChallengePrompt(
          ChallengeValidation.AccountPassword,
          undefined,
          Messages.ChallengeStrings.AccountPasswordPlaceholder,
        ),
      )
    }
    const challenge = new Challenge(prompts, ChallengeReason.ProtocolUpgrade, true)
    const response = await this.challengeService.promptForChallengeResponse(challenge)
    if (!response) {
      return { canceled: true }
    }
    const dismissBlockingDialog = await this.alertService.blockingDialog(
      Messages.DO_NOT_CLOSE_APPLICATION,
      Messages.UPGRADING_ENCRYPTION,
    )
    try {
      let passcode: string | undefined
      if (hasPasscode) {
        /* Upgrade passcode version */
        const value = response.getValueForType(ChallengeValidation.LocalPasscode)
        passcode = value.value as string
      }
      if (hasAccount) {
        /* Upgrade account version */
        const value = response.getValueForType(ChallengeValidation.AccountPassword)
        const password = value.value as string
        const changeResponse = await this.changeCredentials({
          currentPassword: password,
          newPassword: password,
          passcode,
          origination: KeyParamsOrigination.ProtocolUpgrade,
          validateNewPasswordStrength: false,
        })
        if (changeResponse?.error) {
          return { error: changeResponse.error }
        }
      }
      if (hasPasscode) {
        /* Upgrade passcode version */
        await this.removePasscodeWithoutWarning()
        await this.setPasscodeWithoutWarning(passcode as string, KeyParamsOrigination.ProtocolUpgrade)
      }
      return { success: true }
    } catch (error) {
      return { error: error as Error }
    } finally {
      dismissBlockingDialog()
    }
  }

  public async addPasscode(passcode: string): Promise<boolean> {
    if (passcode.length < this.MINIMUM_PASSCODE_LENGTH) {
      return false
    }
    if (!(await this.protectionService.authorizeAddingPasscode())) {
      return false
    }

    const dismissBlockingDialog = await this.alertService.blockingDialog(
      Messages.DO_NOT_CLOSE_APPLICATION,
      Messages.SETTING_PASSCODE,
    )
    try {
      await this.setPasscodeWithoutWarning(passcode, KeyParamsOrigination.PasscodeCreate)
      return true
    } finally {
      dismissBlockingDialog()
    }
  }

  public async removePasscode(): Promise<boolean> {
    if (!(await this.protectionService.authorizeRemovingPasscode())) {
      return false
    }

    const dismissBlockingDialog = await this.alertService.blockingDialog(
      Messages.DO_NOT_CLOSE_APPLICATION,
      Messages.REMOVING_PASSCODE,
    )
    try {
      await this.removePasscodeWithoutWarning()
      return true
    } finally {
      dismissBlockingDialog()
    }
  }

  /**
   * @returns whether the passcode was successfuly changed or not
   */
  public async changePasscode(
    newPasscode: string,
    origination = KeyParamsOrigination.PasscodeChange,
  ): Promise<boolean> {
    if (newPasscode.length < this.MINIMUM_PASSCODE_LENGTH) {
      return false
    }
    if (!(await this.protectionService.authorizeChangingPasscode())) {
      return false
    }

    const dismissBlockingDialog = await this.alertService.blockingDialog(
      Messages.DO_NOT_CLOSE_APPLICATION,
      origination === KeyParamsOrigination.ProtocolUpgrade
        ? Messages.ProtocolUpgradeStrings.UpgradingPasscode
        : Messages.CHANGING_PASSCODE,
    )
    try {
      await this.removePasscodeWithoutWarning()
      await this.setPasscodeWithoutWarning(newPasscode, origination)
      return true
    } finally {
      dismissBlockingDialog()
    }
  }

  private async setPasscodeWithoutWarning(passcode: string, origination: KeyParamsOrigination) {
    const identifier = UuidGenerator.GenerateUuid()
    const key = await this.protocolService.createRootKey(identifier, passcode, origination)
    await this.protocolService.setNewRootKeyWrapper(key)
    await this.rewriteItemsKeys()
    await this.syncService.sync()
  }

  private async removePasscodeWithoutWarning() {
    await this.protocolService.removePasscode()
    await this.rewriteItemsKeys()
  }

  /**
   * Allows items keys to be rewritten to local db on local credential status change,
   * such as if passcode is added, changed, or removed.
   * This allows IndexedDB unencrypted logs to be deleted
   * `deletePayloads` will remove data from backing store,
   * but not from working memory See:
   * https://github.com/standardnotes/desktop/issues/131
   */
  private async rewriteItemsKeys(): Promise<void> {
    const itemsKeys = this.itemManager.getDisplayableItemsKeys()
    const payloads = itemsKeys.map((key) => key.payloadRepresentation())
    await this.storageService.forceDeletePayloads(payloads)
    await this.syncService.persistPayloads(payloads)
  }

  private lockSyncing(): void {
    this.syncService.lockSyncing()
  }

  private unlockSyncing(): void {
    this.syncService.unlockSyncing()
  }

  private clearDatabase(): Promise<void> {
    return this.storageService.clearAllPayloads()
  }

  private async performCredentialsChange(parameters: {
    currentPassword: string
    origination: KeyParamsOrigination
    validateNewPasswordStrength: boolean
    newEmail?: string
    newPassword?: string
    passcode?: string
  }): Promise<CredentialsChangeFunctionResponse> {
    const { wrappingKey, canceled } = await this.challengeService.getWrappingKeyIfApplicable(parameters.passcode)

    if (canceled) {
      return { error: Error(Messages.CredentialsChangeStrings.PasscodeRequired) }
    }

    if (parameters.newPassword !== undefined && parameters.validateNewPasswordStrength) {
      if (parameters.newPassword.length < this.MINIMUM_PASSWORD_LENGTH) {
        return {
          error: Error(Messages.InsufficientPasswordMessage(this.MINIMUM_PASSWORD_LENGTH)),
        }
      }
    }

    const accountPasswordValidation = await this.protocolService.validateAccountPassword(parameters.currentPassword)
    if (!accountPasswordValidation.valid) {
      return {
        error: Error(Messages.INVALID_PASSWORD),
      }
    }

    const user = this.sessionManager.getUser() as User
    const currentEmail = user.email
    const rootKeys = await this.recomputeRootKeysForCredentialChange({
      currentPassword: parameters.currentPassword,
      currentEmail,
      origination: parameters.origination,
      newEmail: parameters.newEmail,
      newPassword: parameters.newPassword,
    })

    this.lockSyncing()

    /** Now, change the credentials on the server. Roll back on failure */
    const result = await this.sessionManager.changeCredentials({
      currentServerPassword: rootKeys.currentRootKey.serverPassword as string,
      newRootKey: rootKeys.newRootKey,
      wrappingKey,
      newEmail: parameters.newEmail,
    })

    this.unlockSyncing()

    if (!result.response.error) {
      const rollback = await this.protocolService.createNewItemsKeyWithRollback()
      await this.protocolService.reencryptItemsKeys()
      await this.syncService.sync({ awaitAll: true })

      const defaultItemsKey = this.protocolService.getSureDefaultItemsKey()
      const itemsKeyWasSynced = !defaultItemsKey.neverSynced

      if (!itemsKeyWasSynced) {
        await this.sessionManager.changeCredentials({
          currentServerPassword: rootKeys.newRootKey.serverPassword as string,
          newRootKey: rootKeys.currentRootKey,
          wrappingKey,
        })
        await this.protocolService.reencryptItemsKeys()
        await rollback()
        await this.syncService.sync({ awaitAll: true })

        return { error: Error(Messages.CredentialsChangeStrings.Failed) }
      }
    }

    return result.response
  }

  private async recomputeRootKeysForCredentialChange(parameters: {
    currentPassword: string
    currentEmail: string
    origination: KeyParamsOrigination
    newEmail?: string
    newPassword?: string
  }): Promise<{ currentRootKey: SNRootKey; newRootKey: SNRootKey }> {
    const currentRootKey = await this.protocolService.computeRootKey(
      parameters.currentPassword,
      (await this.protocolService.getRootKeyParams()) as SNRootKeyParams,
    )
    const newRootKey = await this.protocolService.createRootKey(
      parameters.newEmail ?? parameters.currentEmail,
      parameters.newPassword ?? parameters.currentPassword,
      parameters.origination,
    )

    return {
      currentRootKey,
      newRootKey,
    }
  }
}

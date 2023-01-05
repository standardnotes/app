import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { CopyPayloadWithContentOverride } from '@standardnotes/models'
import {
  AuthClientInterface,
  EXPIRED_PROTOCOL_VERSION,
  ItemManagerInterface,
  KeyValueStoreInterface,
  SessionsClientInterface,
  StorageKey,
  StoragePersistencePolicies,
  StorageServiceInterface,
  SyncServiceInterface,
  UNSUPPORTED_KEY_DERIVATION,
  UNSUPPORTED_PROTOCOL_VERSION,
  UserClientInterface,
} from '@standardnotes/services'
import { CreateAnyKeyParams, EncryptionProviderInterface, SNRootKey } from '@standardnotes/encryption'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'

import { SignInWithRecoveryCodesDTO } from './SignInWithRecoveryCodesDTO'

export class SignInWithRecoveryCodes implements UseCaseInterface<void> {
  constructor(
    private authManager: AuthClientInterface,
    private protocolService: EncryptionProviderInterface,
    private inMemoryStore: KeyValueStoreInterface<string>,
    private crypto: PureCryptoInterface,
    private sessionManager: SessionsClientInterface,
    private syncService: SyncServiceInterface,
    private storageService: StorageServiceInterface,
    private itemManager: ItemManagerInterface,
    private userService: UserClientInterface,
  ) {}

  async execute(dto: SignInWithRecoveryCodesDTO): Promise<Result<void>> {
    this.syncService.lockSyncing()

    if (this.protocolService.hasAccount()) {
      this.syncService.unlockSyncing()

      return Result.fail('Tried to sign in when an account already exists.')
    }

    const codeVerifier = this.crypto.generateRandomKey(256)
    this.inMemoryStore.setValue(StorageKey.CodeVerifier, codeVerifier)

    const codeChallenge = this.crypto.base64URLEncode(await this.crypto.sha256(codeVerifier))

    const recoveryKeyParams = await this.authManager.recoveryKeyParams({
      codeChallenge,
      ...dto,
    })

    if (recoveryKeyParams === false) {
      this.syncService.unlockSyncing()

      return Result.fail('Could not retrieve recovery key params')
    }

    const rootKeyParams = CreateAnyKeyParams(recoveryKeyParams)

    if (!this.protocolService.supportedVersions().includes(rootKeyParams.version)) {
      this.syncService.unlockSyncing()

      if (this.protocolService.isVersionNewerThanLibraryVersion(rootKeyParams.version)) {
        return Result.fail(UNSUPPORTED_PROTOCOL_VERSION)
      }

      return Result.fail(EXPIRED_PROTOCOL_VERSION)
    }

    if (!this.protocolService.platformSupportsKeyDerivation(rootKeyParams)) {
      this.syncService.unlockSyncing()

      return Result.fail(UNSUPPORTED_KEY_DERIVATION)
    }

    const rootKey = await this.protocolService.computeRootKey(dto.password, rootKeyParams)

    const signInResult = await this.authManager.signInWithRecoveryCodes({
      codeVerifier,
      recoveryCodes: dto.recoveryCodes,
      username: dto.username,
      password: rootKey.serverPassword as string,
    })

    if (signInResult === false) {
      this.syncService.unlockSyncing()

      return Result.fail('Could not sign in with recovery codes')
    }

    this.inMemoryStore.removeValue(StorageKey.CodeVerifier)

    const expandedRootKey = new SNRootKey(
      CopyPayloadWithContentOverride(rootKey.payload, {
        keyParams: signInResult.keyParams,
      }),
    )

    await this.sessionManager.handleAuthentication({
      session: signInResult.session,
      user: signInResult.user,
      rootKey: expandedRootKey,
    })

    this.syncService.resetSyncState()

    await this.storageService.setPersistencePolicy(StoragePersistencePolicies.Default)

    void this.itemManager.removeAllItemsFromMemory()

    await this.storageService.clearAllPayloads()

    await this.userService.handleSignIn()

    this.syncService.unlockSyncing()

    void this.syncService.downloadFirstSync(1_000, {
      checkIntegrity: true,
      awaitAll: false,
    })

    return Result.ok()
  }
}

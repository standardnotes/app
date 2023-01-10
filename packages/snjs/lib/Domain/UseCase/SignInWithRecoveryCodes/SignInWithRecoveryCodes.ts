import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { CopyPayloadWithContentOverride } from '@standardnotes/models'
import {
  AccountEvent,
  AuthClientInterface,
  EXPIRED_PROTOCOL_VERSION,
  InternalEventBusInterface,
  InternalEventPublishStrategy,
  KeyValueStoreInterface,
  SessionsClientInterface,
  StorageKey,
  UNSUPPORTED_KEY_DERIVATION,
  UNSUPPORTED_PROTOCOL_VERSION,
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
    private internalEventBus: InternalEventBusInterface,
  ) {}

  async execute(dto: SignInWithRecoveryCodesDTO): Promise<Result<void>> {
    if (this.protocolService.hasAccount()) {
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
      return Result.fail('Could not retrieve recovery key params')
    }

    const rootKeyParams = CreateAnyKeyParams(recoveryKeyParams)

    if (!this.protocolService.supportedVersions().includes(rootKeyParams.version)) {
      if (this.protocolService.isVersionNewerThanLibraryVersion(rootKeyParams.version)) {
        return Result.fail(UNSUPPORTED_PROTOCOL_VERSION)
      }

      return Result.fail(EXPIRED_PROTOCOL_VERSION)
    }

    if (!this.protocolService.platformSupportsKeyDerivation(rootKeyParams)) {
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
      return Result.fail('Could not sign in with recovery code')
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

    await this.internalEventBus.publishSync(
      {
        type: AccountEvent.SignedInOrRegistered,
        payload: {
          payload: {
            ephemeral: false,
            mergeLocal: false,
            awaitSync: true,
            checkIntegrity: false,
          },
        },
      },
      InternalEventPublishStrategy.SEQUENCE,
    )

    return Result.ok()
  }
}

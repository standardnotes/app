import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { RootKeyManager } from '../../RootKeyManager/RootKeyManager'

type UsecaseResult = {
  encryption: PkcKeyPair
  signing: PkcKeyPair
}

export class GetKeyPairs implements SyncUseCaseInterface<UsecaseResult> {
  constructor(private rootKeyManager: RootKeyManager) {}

  execute(): Result<UsecaseResult> {
    const rootKey = this.rootKeyManager.getRootKey()

    if (!rootKey?.encryptionKeyPair || !rootKey?.signingKeyPair) {
      return Result.fail('Account keypair not found')
    }

    return Result.ok({
      encryption: rootKey.encryptionKeyPair,
      signing: rootKey.signingKeyPair,
    })
  }
}

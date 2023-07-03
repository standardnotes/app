import { EncryptedOutputParameters, OperatorManager, encryptPayload } from '@standardnotes/encryption'
import { DecryptedPayloadInterface, KeySystemRootKeyInterface, RootKeyInterface } from '@standardnotes/models'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'

export class RootKeyEncryptPayloadUseCase {
  constructor(private operatorManager: OperatorManager) {}

  async execute(
    payload: DecryptedPayloadInterface,
    key: RootKeyInterface | KeySystemRootKeyInterface,
    signingKeyPair?: PkcKeyPair,
  ): Promise<EncryptedOutputParameters> {
    return encryptPayload(payload, key, this.operatorManager, signingKeyPair)
  }
}

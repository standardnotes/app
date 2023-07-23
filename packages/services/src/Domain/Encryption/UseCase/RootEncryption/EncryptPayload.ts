import { EncryptedOutputParameters, EncryptionOperatorsInterface, encryptPayload } from '@standardnotes/encryption'
import { DecryptedPayloadInterface, KeySystemRootKeyInterface, RootKeyInterface } from '@standardnotes/models'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'

export class RootKeyEncryptPayloadUseCase {
  constructor(private operatorManager: EncryptionOperatorsInterface) {}

  async executeOne(
    payload: DecryptedPayloadInterface,
    key: RootKeyInterface | KeySystemRootKeyInterface,
    signingKeyPair?: PkcKeyPair,
  ): Promise<EncryptedOutputParameters> {
    return encryptPayload(payload, key, this.operatorManager, signingKeyPair)
  }

  async executeMany(
    payloads: DecryptedPayloadInterface[],
    key: RootKeyInterface | KeySystemRootKeyInterface,
    signingKeyPair?: PkcKeyPair,
  ): Promise<EncryptedOutputParameters[]> {
    return Promise.all(payloads.map((payload) => this.executeOne(payload, key, signingKeyPair)))
  }
}

import { EncryptedOutputParameters, EncryptionOperatorsInterface, encryptPayload } from '@standardnotes/encryption'
import { DecryptedPayloadInterface, KeySystemRootKeyInterface, RootKeyInterface } from '@standardnotes/models'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'

export class EncryptTypeAPayload {
  constructor(private operators: EncryptionOperatorsInterface) {}

  async executeOne(
    payload: DecryptedPayloadInterface,
    key: RootKeyInterface | KeySystemRootKeyInterface,
    signingKeyPair?: PkcKeyPair,
  ): Promise<EncryptedOutputParameters> {
    return encryptPayload(payload, key, this.operators, signingKeyPair)
  }

  async executeMany(
    payloads: DecryptedPayloadInterface[],
    key: RootKeyInterface | KeySystemRootKeyInterface,
    signingKeyPair?: PkcKeyPair,
  ): Promise<EncryptedOutputParameters[]> {
    return Promise.all(payloads.map((payload) => this.executeOne(payload, key, signingKeyPair)))
  }
}

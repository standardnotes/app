import {
  DecryptedParameters,
  ErrorDecryptingParameters,
  OperatorManager,
  decryptPayload,
} from '@standardnotes/encryption'
import {
  EncryptedPayloadInterface,
  ItemContent,
  KeySystemRootKeyInterface,
  RootKeyInterface,
} from '@standardnotes/models'

export class RootKeyDecryptPayloadUseCase {
  constructor(private operatorManager: OperatorManager) {}

  async executeOne<C extends ItemContent = ItemContent>(
    payload: EncryptedPayloadInterface,
    key: RootKeyInterface | KeySystemRootKeyInterface,
  ): Promise<DecryptedParameters<C> | ErrorDecryptingParameters> {
    return decryptPayload(payload, key, this.operatorManager)
  }

  async executeMany<C extends ItemContent = ItemContent>(
    payloads: EncryptedPayloadInterface[],
    key: RootKeyInterface | KeySystemRootKeyInterface,
  ): Promise<(DecryptedParameters<C> | ErrorDecryptingParameters)[]> {
    return Promise.all(payloads.map((payload) => this.executeOne<C>(payload, key)))
  }
}

import {
  DecryptedParameters,
  ErrorDecryptingParameters,
  KeySystemKeyManagerInterface,
  OperatorManager,
} from '@standardnotes/encryption'
import {
  ContentTypeUsesKeySystemRootKeyEncryption,
  EncryptedPayloadInterface,
  ItemContent,
  KeySystemRootKeyInterface,
  RootKeyInterface,
} from '@standardnotes/models'

import { RootKeyManager } from '../RootKeyManager'
import { RootKeyDecryptPayloadUseCase } from './DecryptPayload'

export class RootKeyDecryptPayloadWithKeyLookupUseCase {
  constructor(
    private operatorManager: OperatorManager,
    private keySystemKeyManager: KeySystemKeyManagerInterface,
    private rootKeyManager: RootKeyManager,
  ) {}

  async execute<C extends ItemContent = ItemContent>(
    payload: EncryptedPayloadInterface,
  ): Promise<DecryptedParameters<C> | ErrorDecryptingParameters> {
    let key: RootKeyInterface | KeySystemRootKeyInterface | undefined
    if (ContentTypeUsesKeySystemRootKeyEncryption(payload.content_type)) {
      if (!payload.key_system_identifier) {
        throw Error('Key system root key encrypted payload is missing key_system_identifier')
      }
      key = this.keySystemKeyManager.getPrimaryKeySystemRootKey(payload.key_system_identifier)
    } else {
      key = this.rootKeyManager.getRootKey()
    }

    if (key == undefined) {
      return {
        uuid: payload.uuid,
        errorDecrypting: true,
        waitingForKey: true,
      }
    }

    const usecase = new RootKeyDecryptPayloadUseCase(this.operatorManager)

    return usecase.execute(payload, key)
  }
}

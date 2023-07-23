import {
  ContentTypeUsesKeySystemRootKeyEncryption,
  ContentTypeUsesRootKeyEncryption,
  DecryptedPayload,
  EncryptedPayload,
  PayloadEmitSource,
  SureFindPayload,
} from '@standardnotes/models'
import { PayloadManagerInterface } from './../../../Payloads/PayloadManagerInterface'
import {
  KeySystemKeyManagerInterface,
  isErrorDecryptingParameters,
  EncryptionOperatorsInterface,
} from '@standardnotes/encryption'
import { RootKeyDecryptPayloadWithKeyLookupUseCase } from './DecryptPayloadWithKeyLookup'
import { RootKeyManager } from '../../RootKey/RootKeyManager'

export class DecryptErroredRootPayloadsUseCase {
  constructor(
    private payloads: PayloadManagerInterface,
    private operatorManager: EncryptionOperatorsInterface,
    private keySystemKeyManager: KeySystemKeyManagerInterface,
    private rootKeyManager: RootKeyManager,
  ) {}

  async execute(): Promise<void> {
    const erroredRootPayloads = this.payloads.invalidPayloads.filter(
      (i) =>
        ContentTypeUsesRootKeyEncryption(i.content_type) || ContentTypeUsesKeySystemRootKeyEncryption(i.content_type),
    )
    if (erroredRootPayloads.length === 0) {
      return
    }

    const usecase = new RootKeyDecryptPayloadWithKeyLookupUseCase(
      this.operatorManager,
      this.keySystemKeyManager,
      this.rootKeyManager,
    )
    const resultParams = await usecase.executeMany(erroredRootPayloads)

    const decryptedPayloads = resultParams.map((params) => {
      const original = SureFindPayload(erroredRootPayloads, params.uuid)
      if (isErrorDecryptingParameters(params)) {
        return new EncryptedPayload({
          ...original.ejected(),
          ...params,
        })
      } else {
        return new DecryptedPayload({
          ...original.ejected(),
          ...params,
        })
      }
    })

    await this.payloads.emitPayloads(decryptedPayloads, PayloadEmitSource.LocalChanged)
  }
}

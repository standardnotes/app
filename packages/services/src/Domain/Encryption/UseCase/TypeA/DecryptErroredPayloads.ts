import {
  ContentTypeUsesKeySystemRootKeyEncryption,
  ContentTypeUsesRootKeyEncryption,
  DecryptedPayload,
  EncryptedPayload,
  PayloadEmitSource,
  SureFindPayload,
} from '@standardnotes/models'
import { isErrorDecryptingParameters } from '@standardnotes/encryption'
import { PayloadManagerInterface } from '../../../Payloads/PayloadManagerInterface'
import { DecryptTypeAPayloadWithKeyLookup } from './DecryptPayloadWithKeyLookup'

export class DecryptErroredTypeAPayloads {
  constructor(
    private payloads: PayloadManagerInterface,
    private _decryptTypeAPayloadWithKeyLookup: DecryptTypeAPayloadWithKeyLookup,
  ) {}

  async execute(): Promise<void> {
    const erroredRootPayloads = this.payloads.invalidPayloads.filter(
      (i) =>
        ContentTypeUsesRootKeyEncryption(i.content_type) || ContentTypeUsesKeySystemRootKeyEncryption(i.content_type),
    )
    if (erroredRootPayloads.length === 0) {
      return
    }

    const resultParams = await this._decryptTypeAPayloadWithKeyLookup.executeMany(erroredRootPayloads)

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

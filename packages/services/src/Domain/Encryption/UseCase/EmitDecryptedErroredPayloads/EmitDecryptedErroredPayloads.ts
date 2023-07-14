import {
  ContentTypeUsesKeySystemRootKeyEncryption,
  ContentTypeUsesRootKeyEncryption,
  DecryptedPayload,
  EncryptedPayload,
  PayloadEmitSource,
  SureFindPayload,
} from '@standardnotes/models'
import { isErrorDecryptingParameters } from '@standardnotes/encryption'
import { UseCaseInterface, Result } from '@standardnotes/domain-core'

import { PayloadManagerInterface } from '../../../Payloads/PayloadManagerInterface'

import { DecryptPayloads } from '../DecryptPayloads/DecryptPayloads'

export class EmitDecryptedErroredPayloads implements UseCaseInterface<void> {
  constructor(private payloadsManager: PayloadManagerInterface, private decryptPayloadsUseCase: DecryptPayloads) {}

  async execute(): Promise<Result<void>> {
    const erroredRootPayloads = this.payloadsManager.invalidPayloads.filter(
      (i) =>
        ContentTypeUsesRootKeyEncryption(i.content_type) || ContentTypeUsesKeySystemRootKeyEncryption(i.content_type),
    )
    if (erroredRootPayloads.length === 0) {
      return Result.fail('No errored payloads found')
    }

    const decryptedPaylodsAndErrorsOrFail = await this.decryptPayloadsUseCase.execute({
      payloads: erroredRootPayloads,
    })
    if (decryptedPaylodsAndErrorsOrFail.isFailed()) {
      return Result.fail(decryptedPaylodsAndErrorsOrFail.getError())
    }
    const decryptedPaylodsAndErrors = decryptedPaylodsAndErrorsOrFail.getValue()

    const decryptedPayloads = decryptedPaylodsAndErrors.map((params) => {
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

    await this.payloadsManager.emitPayloads(decryptedPayloads, PayloadEmitSource.LocalChanged)

    return Result.ok()
  }
}

import {
  DecryptedParameters,
  ErrorDecryptingParameters,
  KeySystemKeyManagerInterface,
  OperatorManager,
  decryptPayload,
} from '@standardnotes/encryption'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import {
  ContentTypeUsesKeySystemRootKeyEncryption,
  EncryptedPayloadInterface,
  ItemContent,
  KeySystemRootKeyInterface,
  RootKeyInterface,
} from '@standardnotes/models'

import { DecryptPayloadsDTO } from './DecryptPayloadsDTO'

export class DecryptPayloads implements UseCaseInterface<(DecryptedParameters | ErrorDecryptingParameters)[]> {
  constructor(private operatorManager: OperatorManager, private keySystemKeyManager: KeySystemKeyManagerInterface) {}

  async execute<C extends ItemContent = ItemContent>(
    dto: DecryptPayloadsDTO,
  ): Promise<Result<(DecryptedParameters<C> | ErrorDecryptingParameters)[]>> {
    const decryptedOrErroredParameters = []
    for (const payload of dto.payloads) {
      const keyForPayloadOrError = this.getKeyForPayload({
        payload,
        existingKey: dto.key,
        fallbackRootKey: dto.fallbackRootKey,
      })
      if (keyForPayloadOrError.isFailed()) {
        const errorDecryptingParamteres: ErrorDecryptingParameters = {
          uuid: payload.uuid,
          errorDecrypting: true,
          waitingForKey: true,
        }
        decryptedOrErroredParameters.push(errorDecryptingParamteres)

        continue
      }
      const key = keyForPayloadOrError.getValue()

      decryptedOrErroredParameters.push(await decryptPayload<C>(payload, key, this.operatorManager))
    }

    return Result.ok(decryptedOrErroredParameters)
  }

  private getKeyForPayload(dto: {
    payload: EncryptedPayloadInterface
    existingKey?: RootKeyInterface | KeySystemRootKeyInterface
    fallbackRootKey?: RootKeyInterface
  }): Result<RootKeyInterface | KeySystemRootKeyInterface> {
    let key = dto.existingKey
    if (key === undefined) {
      if (ContentTypeUsesKeySystemRootKeyEncryption(dto.payload.content_type)) {
        if (!dto.payload.key_system_identifier) {
          return Result.fail('Key system root key encrypted payload is missing key_system_identifier')
        }
        key = this.keySystemKeyManager.getPrimaryKeySystemRootKey(dto.payload.key_system_identifier)
      } else {
        key = dto.fallbackRootKey
      }
    }

    if (key === undefined) {
      return Result.fail('Attempting root key decryption with no root key')
    }

    return Result.ok(key)
  }
}

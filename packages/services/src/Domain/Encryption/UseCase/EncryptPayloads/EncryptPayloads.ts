import {
  EncryptedOutputParameters,
  KeySystemKeyManagerInterface,
  OperatorManager,
  encryptPayload,
} from '@standardnotes/encryption'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import {
  ContentTypeUsesKeySystemRootKeyEncryption,
  DecryptedPayloadInterface,
  KeySystemRootKeyInterface,
  RootKeyInterface,
} from '@standardnotes/models'

import { EncryptPayloadsDTO } from './EncryptPayloadsDTO'

export class EncryptPayloads implements UseCaseInterface<EncryptedOutputParameters[]> {
  constructor(private operatorManager: OperatorManager, private keySystemKeyManager: KeySystemKeyManagerInterface) {}

  async execute(dto: EncryptPayloadsDTO): Promise<Result<EncryptedOutputParameters[]>> {
    try {
      const encryptedPayloads = []
      for (const payload of dto.payloads) {
        const keyForPayloadOrError = this.getKeyForPayload({
          payload,
          existingKey: dto.key,
          fallbackRootKey: dto.fallbackRootKey,
        })
        if (keyForPayloadOrError.isFailed()) {
          return Result.fail(keyForPayloadOrError.getError())
        }
        const key = keyForPayloadOrError.getValue()

        encryptedPayloads.push(await encryptPayload(payload, key, this.operatorManager, dto.signingKeyPair))
      }

      return Result.ok(encryptedPayloads)
    } catch (error) {
      return Result.fail((error as Error).message)
    }
  }

  private getKeyForPayload(dto: {
    payload: DecryptedPayloadInterface
    existingKey?: RootKeyInterface | KeySystemRootKeyInterface
    fallbackRootKey?: RootKeyInterface
  }): Result<RootKeyInterface | KeySystemRootKeyInterface> {
    let key = dto.existingKey
    if (key === undefined) {
      if (ContentTypeUsesKeySystemRootKeyEncryption(dto.payload.content_type)) {
        if (!dto.payload.key_system_identifier) {
          return Result.fail(
            `Key system-encrypted payload ${dto.payload.content_type}is missing a key_system_identifier`,
          )
        }
        key = this.keySystemKeyManager.getPrimaryKeySystemRootKey(dto.payload.key_system_identifier)
      } else {
        key = dto.fallbackRootKey
      }
    }

    if (key === undefined) {
      return Result.fail('Attempting root key encryption with no root key')
    }

    return Result.ok(key)
  }
}

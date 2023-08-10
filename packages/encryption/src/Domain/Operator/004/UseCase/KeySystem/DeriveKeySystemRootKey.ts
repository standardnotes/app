import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { UuidGenerator, splitString, truncateHexString } from '@standardnotes/utils'
import { V004PartitionCharacter } from '../../V004AlgorithmTypes'
import { V004Algorithm } from '../../../../Algorithm'
import {
  DecryptedPayload,
  FillItemContentSpecialized,
  KeySystemRootKey,
  KeySystemRootKeyContent,
  KeySystemRootKeyContentSpecialized,
  KeySystemRootKeyInterface,
  PayloadTimestampDefaults,
  KeySystemRootKeyParamsInterface,
  ProtocolVersion,
} from '@standardnotes/models'
import { ContentType } from '@standardnotes/domain-core'

export class DeriveKeySystemRootKeyUseCase {
  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(dto: { password: string; keyParams: KeySystemRootKeyParamsInterface }): KeySystemRootKeyInterface {
    const seed = dto.keyParams.seed
    const salt = this.generateSalt(dto.keyParams.systemIdentifier, seed)
    const derivedKey = this.crypto.argon2(
      dto.password,
      salt,
      V004Algorithm.ArgonIterations,
      V004Algorithm.ArgonMemLimit,
      V004Algorithm.ArgonOutputKeyBytes,
    )

    const partitions = splitString(derivedKey, 2)
    const masterKey = partitions[0]
    const token = partitions[1]

    const uuid = UuidGenerator.GenerateUuid()

    const content: KeySystemRootKeyContentSpecialized = {
      systemIdentifier: dto.keyParams.systemIdentifier,
      key: masterKey,
      keyVersion: ProtocolVersion.V004,
      keyParams: dto.keyParams,
      token,
    }

    const payload = new DecryptedPayload<KeySystemRootKeyContent>({
      uuid: uuid,
      content_type: ContentType.TYPES.KeySystemRootKey,
      content: FillItemContentSpecialized(content),
      ...PayloadTimestampDefaults(),
    })

    return new KeySystemRootKey(payload)
  }

  private generateSalt(identifier: string, seed: string) {
    const hash = this.crypto.sodiumCryptoGenericHash([identifier, seed].join(V004PartitionCharacter))

    return truncateHexString(hash, V004Algorithm.ArgonSaltLength)
  }
}

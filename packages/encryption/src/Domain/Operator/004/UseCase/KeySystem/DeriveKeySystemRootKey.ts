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
} from '@standardnotes/models'
import { ContentType, ProtocolVersion } from '@standardnotes/common'

export class DeriveKeySystemRootKeyUseCase {
  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(dto: {
    password: string
    keyParams: KeySystemRootKeyParamsInterface
    systemName: string
    systemDescription?: string
  }): KeySystemRootKeyInterface {
    const seed = dto.keyParams.seed
    const salt = this.generateSalt(dto.keyParams.identifier, seed)
    const derivedKey = this.crypto.argon2(
      dto.password,
      salt,
      V004Algorithm.ArgonIterations,
      V004Algorithm.ArgonMemLimit,
      V004Algorithm.ArgonOutputKeyBytes,
    )

    const partitions = splitString(derivedKey, 2)
    const key = partitions[0]
    const itemsKeyAnchor = partitions[1]

    const uuid = UuidGenerator.GenerateUuid()

    const content: KeySystemRootKeyContentSpecialized = {
      systemName: dto.systemName,
      systemIdentifier: dto.keyParams.identifier,
      systemDescription: dto.systemDescription,
      key: key,
      keyTimestamp: new Date().getTime(),
      keyVersion: ProtocolVersion.V004,
      keyParams: dto.keyParams,
      itemsKeyAnchor: itemsKeyAnchor,
    }

    const payload = new DecryptedPayload<KeySystemRootKeyContent>({
      uuid: uuid,
      content_type: ContentType.KeySystemRootKey,
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

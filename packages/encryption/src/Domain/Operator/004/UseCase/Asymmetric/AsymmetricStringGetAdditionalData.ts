import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { AsymmetricallyEncryptedString } from '../../../Types/Types'
import { V004AsymmetricStringComponents } from '../../V004AlgorithmTypes'
import { ParseConsistentBase64JsonPayloadUseCase } from '../Utils/ParseConsistentBase64JsonPayload'
import { AsymmetricItemAdditionalData } from '../../../../Types/EncryptionAdditionalData'
import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'

export class AsymmetricStringGetAdditionalData004 implements SyncUseCaseInterface<AsymmetricItemAdditionalData> {
  private parseBase64Usecase = new ParseConsistentBase64JsonPayloadUseCase(this.crypto)

  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(dto: { encryptedString: AsymmetricallyEncryptedString }): Result<AsymmetricItemAdditionalData> {
    const [_, __, ___, additionalDataString] = <V004AsymmetricStringComponents>dto.encryptedString.split(':')

    const additionalData = this.parseBase64Usecase.execute<AsymmetricItemAdditionalData>(additionalDataString)

    return Result.ok(additionalData)
  }
}

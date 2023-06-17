import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { V004Algorithm } from '../../../../Algorithm'
import {
  KeySystemRootKeyInterface,
  KeySystemRootKeyParamsInterface,
  KeySystemRootKeyPasswordType,
} from '@standardnotes/models'
import { ProtocolVersion } from '@standardnotes/common'
import { DeriveKeySystemRootKeyUseCase } from './DeriveKeySystemRootKey'

export class CreateRandomKeySystemRootKey {
  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(dto: { systemIdentifier: string }): KeySystemRootKeyInterface {
    const version = ProtocolVersion.V004

    const seed = this.crypto.generateRandomKey(V004Algorithm.ArgonSaltSeedLength)

    const randomPassword = this.crypto.generateRandomKey(32)

    const keyParams: KeySystemRootKeyParamsInterface = {
      systemIdentifier: dto.systemIdentifier,
      passwordType: KeySystemRootKeyPasswordType.Randomized,
      creationTimestamp: new Date().getTime(),
      seed,
      version,
    }

    const usecase = new DeriveKeySystemRootKeyUseCase(this.crypto)
    return usecase.execute({
      password: randomPassword,
      keyParams,
    })
  }
}

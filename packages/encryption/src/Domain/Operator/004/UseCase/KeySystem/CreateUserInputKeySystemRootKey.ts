import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { V004Algorithm } from '../../../../Algorithm'
import {
  KeySystemIdentifier,
  KeySystemRootKeyInterface,
  KeySystemRootKeyParamsInterface,
  KeySystemRootKeyPasswordType,
} from '@standardnotes/models'
import { ProtocolVersion } from '@standardnotes/common'
import { DeriveKeySystemRootKeyUseCase } from './DeriveKeySystemRootKey'

export class CreateUserInputKeySystemRootKey {
  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(dto: {
    systemIdentifier: KeySystemIdentifier
    systemName: string
    systemDescription?: string
    userInputtedPassword: string
  }): KeySystemRootKeyInterface {
    const version = ProtocolVersion.V004

    const seed = this.crypto.generateRandomKey(V004Algorithm.ArgonSaltSeedLength)

    const keyParams: KeySystemRootKeyParamsInterface = {
      identifier: dto.systemIdentifier,
      passwordType: KeySystemRootKeyPasswordType.UserInputted,
      seed,
      version,
    }

    const usecase = new DeriveKeySystemRootKeyUseCase(this.crypto)
    return usecase.execute({
      password: dto.userInputtedPassword,
      keyParams,
      systemName: dto.systemName,
      systemDescription: dto.systemDescription,
    })
  }
}

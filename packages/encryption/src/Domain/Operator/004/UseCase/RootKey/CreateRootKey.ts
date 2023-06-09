import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { V004Algorithm } from '../../../../Algorithm'
import { RootKeyInterface } from '@standardnotes/models'
import { KeyParamsOrigination, ProtocolVersion } from '@standardnotes/common'
import { Create004KeyParams } from '@standardnotes/snjs'
import { DeriveRootKeyUseCase } from './DeriveRootKey'

export class CreateRootKeyUseCase {
  constructor(private readonly crypto: PureCryptoInterface) {}

  async execute<K extends RootKeyInterface>(
    identifier: string,
    password: string,
    origination: KeyParamsOrigination,
  ): Promise<K> {
    const version = ProtocolVersion.V004
    const seed = this.crypto.generateRandomKey(V004Algorithm.ArgonSaltSeedLength)
    const keyParams = Create004KeyParams({
      identifier: identifier,
      pw_nonce: seed,
      version: version,
      origination: origination,
      created: `${Date.now()}`,
    })

    const usecase = new DeriveRootKeyUseCase(this.crypto)
    return usecase.execute(password, keyParams)
  }
}

import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { splitString, truncateHexString } from '@standardnotes/utils'
import { V004PartitionCharacter } from '../../V004AlgorithmTypes'
import { V004Algorithm } from '../../../../Algorithm'
import { RootKeyInterface, ProtocolVersion } from '@standardnotes/models'
import { SNRootKeyParams } from '../../../../Keys/RootKey/RootKeyParams'
import { CreateNewRootKey } from '../../../../Keys/RootKey/Functions'

export class DeriveRootKeyUseCase {
  constructor(private readonly crypto: PureCryptoInterface) {}

  async execute<K extends RootKeyInterface>(password: string, keyParams: SNRootKeyParams): Promise<K> {
    const seed = keyParams.content004.pw_nonce
    const salt = await this.generateSalt(keyParams.content004.identifier, seed)
    const derivedKey = this.crypto.argon2(
      password,
      salt,
      V004Algorithm.ArgonIterations,
      V004Algorithm.ArgonMemLimit,
      V004Algorithm.ArgonOutputKeyBytes,
    )

    const partitions = splitString(derivedKey, 2)
    const masterKey = partitions[0]
    const serverPassword = partitions[1]

    const encryptionKeyPairSeed = this.crypto.sodiumCryptoKdfDeriveFromKey(
      masterKey,
      V004Algorithm.MasterKeyEncryptionKeyPairSubKeyNumber,
      V004Algorithm.MasterKeyEncryptionKeyPairSubKeyBytes,
      V004Algorithm.MasterKeyEncryptionKeyPairSubKeyContext,
    )
    const encryptionKeyPair = this.crypto.sodiumCryptoBoxSeedKeypair(encryptionKeyPairSeed)

    const signingKeyPairSeed = this.crypto.sodiumCryptoKdfDeriveFromKey(
      masterKey,
      V004Algorithm.MasterKeySigningKeyPairSubKeyNumber,
      V004Algorithm.MasterKeySigningKeyPairSubKeyBytes,
      V004Algorithm.MasterKeySigningKeyPairSubKeyContext,
    )
    const signingKeyPair = this.crypto.sodiumCryptoSignSeedKeypair(signingKeyPairSeed)

    return CreateNewRootKey<K>({
      masterKey,
      serverPassword,
      version: ProtocolVersion.V004,
      keyParams: keyParams.getPortableValue(),
      encryptionKeyPair,
      signingKeyPair,
    })
  }

  /**
   * We require both a client-side component and a server-side component in generating a
   * salt. This way, a comprimised server cannot benefit from sending the same seed value
   * for every user. We mix a client-controlled value that is globally unique
   * (their identifier), with a server controlled value to produce a salt for our KDF.
   * @param identifier
   * @param seed
   */
  private async generateSalt(identifier: string, seed: string) {
    const hash = await this.crypto.sha256([identifier, seed].join(V004PartitionCharacter))
    return truncateHexString(hash, V004Algorithm.ArgonSaltLength)
  }
}

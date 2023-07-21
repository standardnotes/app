import { PkcKeyPair, PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { getMockedCrypto } from '../../MockedCrypto'
import { AsymmetricEncrypt004 } from './AsymmetricEncrypt'
import { V004AsymmetricStringComponents } from '../../V004AlgorithmTypes'
import { ParseConsistentBase64JsonPayloadUseCase } from '../Utils/ParseConsistentBase64JsonPayload'
import { AsymmetricItemAdditionalData } from '../../../../Types/EncryptionAdditionalData'

describe('asymmetric encrypt use case', () => {
  let crypto: PureCryptoInterface
  let usecase: AsymmetricEncrypt004
  let encryptionKeyPair: PkcKeyPair
  let signingKeyPair: PkcKeyPair
  let parseBase64Usecase: ParseConsistentBase64JsonPayloadUseCase

  beforeEach(() => {
    crypto = getMockedCrypto()
    usecase = new AsymmetricEncrypt004(crypto)
    encryptionKeyPair = crypto.sodiumCryptoBoxSeedKeypair('seedling')
    signingKeyPair = crypto.sodiumCryptoSignSeedKeypair('seedling')
    parseBase64Usecase = new ParseConsistentBase64JsonPayloadUseCase(crypto)
  })

  it('should generate encrypted string', () => {
    const recipientKeyPair = crypto.sodiumCryptoBoxSeedKeypair('recipient-seedling')

    const result = usecase.execute({
      stringToEncrypt: 'foobar',
      senderKeyPair: encryptionKeyPair,
      senderSigningKeyPair: signingKeyPair,
      recipientPublicKey: recipientKeyPair.publicKey,
    })

    const [version, nonce, ciphertext, additionalDataString] = <V004AsymmetricStringComponents>result.split(':')

    expect(version).toEqual('004_Asym')
    expect(nonce).toEqual(expect.any(String))
    expect(ciphertext).toEqual(expect.any(String))
    expect(additionalDataString).toEqual(expect.any(String))

    const additionalData = parseBase64Usecase.execute<AsymmetricItemAdditionalData>(additionalDataString)
    expect(additionalData.signingData.publicKey).toEqual(signingKeyPair.publicKey)
    expect(additionalData.signingData.signature).toEqual(expect.any(String))
    expect(additionalData.senderPublicKey).toEqual(encryptionKeyPair.publicKey)
  })
})

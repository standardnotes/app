import { PkcKeyPair, PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { getMockedCrypto } from '../../MockedCrypto'
import { AsymmetricDecryptUseCase } from './AsymmetricDecrypt'
import { AsymmetricEncryptUseCase } from './AsymmetricEncrypt'
import { V004AsymmetricStringComponents } from '../../V004AlgorithmTypes'
import { AsymmetricItemAdditionalData } from '../../../../Types/EncryptionAdditionalData'

describe('asymmetric decrypt use case', () => {
  let crypto: PureCryptoInterface
  let usecase: AsymmetricDecryptUseCase
  let recipientKeyPair: PkcKeyPair
  let senderKeyPair: PkcKeyPair
  let senderSigningKeyPair: PkcKeyPair

  beforeEach(() => {
    crypto = getMockedCrypto()
    usecase = new AsymmetricDecryptUseCase(crypto)
    recipientKeyPair = crypto.sodiumCryptoBoxSeedKeypair('recipient-seedling')
    senderKeyPair = crypto.sodiumCryptoBoxSeedKeypair('sender-seedling')
    senderSigningKeyPair = crypto.sodiumCryptoSignSeedKeypair('sender-signing-seedling')
  })

  const getEncryptedString = () => {
    const encryptUsecase = new AsymmetricEncryptUseCase(crypto)

    const result = encryptUsecase.execute({
      stringToEncrypt: 'foobar',
      senderKeyPair: senderKeyPair,
      senderSigningKeyPair: senderSigningKeyPair,
      recipientPublicKey: recipientKeyPair.publicKey,
    })

    return result
  }

  it('should generate decrypted string', () => {
    const encryptedString = getEncryptedString()

    const decrypted = usecase.execute({
      stringToDecrypt: encryptedString,
      recipientSecretKey: recipientKeyPair.privateKey,
    })

    expect(decrypted).toEqual({
      plaintext: 'foobar',
      signatureVerified: true,
      signaturePublicKey: senderSigningKeyPair.publicKey,
      senderPublicKey: senderKeyPair.publicKey,
    })
  })

  it('should fail signature verification if signature is changed', () => {
    const encryptedString = getEncryptedString()

    const [version, nonce, ciphertext] = <V004AsymmetricStringComponents>encryptedString.split(':')

    const corruptAdditionalData: AsymmetricItemAdditionalData = {
      signingData: {
        publicKey: senderSigningKeyPair.publicKey,
        signature: 'corrupt',
      },
      senderPublicKey: senderKeyPair.publicKey,
    }

    const corruptedAdditionalDataString = crypto.base64Encode(JSON.stringify(corruptAdditionalData))

    const corruptEncryptedString = [version, nonce, ciphertext, corruptedAdditionalDataString].join(':')

    const decrypted = usecase.execute({
      stringToDecrypt: corruptEncryptedString,
      recipientSecretKey: recipientKeyPair.privateKey,
    })

    expect(decrypted).toEqual({
      plaintext: 'foobar',
      signatureVerified: false,
      signaturePublicKey: senderSigningKeyPair.publicKey,
      senderPublicKey: senderKeyPair.publicKey,
    })
  })
})

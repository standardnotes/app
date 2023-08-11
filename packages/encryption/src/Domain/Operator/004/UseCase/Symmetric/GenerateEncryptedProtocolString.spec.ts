import { ProtocolVersion } from '@standardnotes/models'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { ItemAuthenticatedData } from './../../../../Types/ItemAuthenticatedData'
import { GenerateEncryptedProtocolStringUseCase } from './GenerateEncryptedProtocolString'
import { AdditionalData } from '../../../../Types/EncryptionAdditionalData'
import { getMockedCrypto } from '../../MockedCrypto'

describe('generate encrypted protocol string', () => {
  let crypto: PureCryptoInterface
  let usecase: GenerateEncryptedProtocolStringUseCase

  beforeEach(() => {
    crypto = getMockedCrypto()
    usecase = new GenerateEncryptedProtocolStringUseCase(crypto)
  })

  it('should generate encrypted protocol string', () => {
    const aad: ItemAuthenticatedData = {
      u: '123',
      v: ProtocolVersion.V004,
    }

    const signingData: AdditionalData = {}

    const nonce = 'noncy'
    crypto.generateRandomKey = jest.fn().mockReturnValue(nonce)

    const plaintext = 'foo'

    const result = usecase.execute(
      plaintext,
      'secret',
      crypto.base64Encode(JSON.stringify(aad)),
      crypto.base64Encode(JSON.stringify(signingData)),
    )

    expect(result).toEqual(
      `004:${nonce}:<e>${plaintext}<e>:${crypto.base64Encode(JSON.stringify(aad))}:${crypto.base64Encode(
        JSON.stringify(signingData),
      )}`,
    )
  })
})

import {
  DecryptedPayload,
  ItemContent,
  ItemsKeyContent,
  PayloadTimestampDefaults,
  ProtocolVersion,
} from '@standardnotes/models'
import { SNItemsKey } from '../../Keys/ItemsKey/ItemsKey'
import { SNProtocolOperator004 } from './Operator004'
import { getMockedCrypto } from './MockedCrypto'
import { deconstructEncryptedPayloadString } from './V004AlgorithmHelpers'
import { ContentType } from '@standardnotes/domain-core'

describe('operator 004', () => {
  const crypto = getMockedCrypto()

  let operator: SNProtocolOperator004

  beforeEach(() => {
    operator = new SNProtocolOperator004(crypto)
  })

  it('should deconstructEncryptedPayloadString', () => {
    const string = '004:noncy:<e>foo<e>:eyJ1IjoiMTIzIiwidiI6IjAwNCJ9'

    const result = deconstructEncryptedPayloadString(string)

    expect(result).toEqual({
      version: '004',
      nonce: 'noncy',
      ciphertext: '<e>foo<e>',
      authenticatedData: 'eyJ1IjoiMTIzIiwidiI6IjAwNCJ9',
      additionalData: 'e30=',
    })
  })

  it('should generateEncryptedParameters', () => {
    const payload = {
      uuid: '123',
      content_type: ContentType.TYPES.Note,
      content: { foo: 'bar' } as unknown as jest.Mocked<ItemContent>,
      ...PayloadTimestampDefaults(),
    } as jest.Mocked<DecryptedPayload>

    const key = new SNItemsKey(
      new DecryptedPayload<ItemsKeyContent>({
        uuid: 'key-456',
        content_type: ContentType.TYPES.ItemsKey,
        content: {
          itemsKey: 'secret',
          version: ProtocolVersion.V004,
        } as jest.Mocked<ItemsKeyContent>,
        ...PayloadTimestampDefaults(),
      }),
    )

    const result = operator.generateEncryptedParameters(payload, key)

    expect(result).toEqual({
      uuid: '123',
      items_key_id: 'key-456',
      key_system_identifier: undefined,
      shared_vault_uuid: undefined,
      content: '004:random-string:<e>{"foo"|"bar"}<e>:base64-{"u"|"123","v"|"004"}:base64-{}',
      content_type: ContentType.TYPES.Note,
      enc_item_key: '004:random-string:<e>random-string<e>:base64-{"u"|"123","v"|"004"}:base64-{}',
      version: '004',
    })
  })
})

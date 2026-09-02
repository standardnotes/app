import { ContentType } from '@standardnotes/domain-core'
import { EncryptedPayloadInterface, ItemsKeyInterface, ProtocolVersion } from '@standardnotes/models'
import { EncryptionOperatorsInterface } from './EncryptionOperatorsInterface'
import { decryptPayload } from './OperatorWrapper'

describe('decryptPayload', () => {
  it('rejects payloads claiming a protocol version below the items key version', async () => {
    const payload = {
      uuid: 'item-1',
      version: ProtocolVersion.V001,
      content: 'encrypted',
      content_type: ContentType.TYPES.Note,
    } as EncryptedPayloadInterface

    const key = {
      keyVersion: ProtocolVersion.V004,
      itemsKey: 'key',
    } as ItemsKeyInterface

    const operatorManager = {
      operatorForVersion: jest.fn(),
    } as unknown as EncryptionOperatorsInterface

    const result = await decryptPayload(payload, key, operatorManager)

    expect(result).toEqual({ uuid: 'item-1', errorDecrypting: true })
    expect(operatorManager.operatorForVersion).not.toHaveBeenCalled()
  })
})

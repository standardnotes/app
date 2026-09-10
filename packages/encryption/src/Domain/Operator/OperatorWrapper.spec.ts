import { ContentType } from '@standardnotes/domain-core'
import { EncryptedPayloadInterface, ItemsKeyInterface, ProtocolVersion } from '@standardnotes/models'
import { EncryptionOperatorsInterface } from './EncryptionOperatorsInterface'
import { decryptPayload } from './OperatorWrapper'

describe('decryptPayload', () => {
  const createPayload = (version: ProtocolVersion): EncryptedPayloadInterface =>
    ({
      uuid: 'item-1',
      version,
      content: 'encrypted',
      content_type: ContentType.TYPES.Note,
      enc_item_key: 'enc-item-key',
    }) as EncryptedPayloadInterface

  const createKey = (keyVersion: ProtocolVersion): ItemsKeyInterface =>
    ({
      keyVersion,
      itemsKey: 'key',
    }) as ItemsKeyInterface

  describe('version guard', () => {
    it('rejects payloads claiming a protocol version below the items key version', async () => {
      const payload = createPayload(ProtocolVersion.V001)
      const key = createKey(ProtocolVersion.V004)

      const operatorManager = {
        operatorForVersion: jest.fn(),
      } as unknown as EncryptionOperatorsInterface

      const result = await decryptPayload(payload, key, operatorManager)

      expect(result).toEqual({ uuid: 'item-1', errorDecrypting: true })
      expect(operatorManager.operatorForVersion).not.toHaveBeenCalled()
    })

    it('proceeds when payload version equals items key version', async () => {
      const payload = createPayload(ProtocolVersion.V004)
      const key = createKey(ProtocolVersion.V004)
      const syncOperator = {
        generateDecryptedParameters: jest.fn().mockReturnValue({ uuid: 'item-1', content: {} }),
      }
      const operatorManager = {
        operatorForVersion: jest.fn().mockReturnValue(syncOperator),
      } as unknown as EncryptionOperatorsInterface

      await decryptPayload(payload, key, operatorManager)

      expect(operatorManager.operatorForVersion).toHaveBeenCalledWith(ProtocolVersion.V004)
    })

    it('proceeds when payload version is above items key version', async () => {
      const payload = createPayload(ProtocolVersion.V004)
      const key = createKey(ProtocolVersion.V003)
      const syncOperator = {
        generateDecryptedParameters: jest.fn().mockReturnValue({ uuid: 'item-1', content: {} }),
      }
      const operatorManager = {
        operatorForVersion: jest.fn().mockReturnValue(syncOperator),
      } as unknown as EncryptionOperatorsInterface

      await decryptPayload(payload, key, operatorManager)

      expect(operatorManager.operatorForVersion).toHaveBeenCalledWith(ProtocolVersion.V004)
    })
  })

  describe('operator delegation', () => {
    it('uses sync operator when operator is not async', async () => {
      const payload = createPayload(ProtocolVersion.V004)
      const key = createKey(ProtocolVersion.V004)
      const decrypted = { uuid: 'item-1', content: { text: 'hello' } }
      const syncOperator = {
        generateDecryptedParameters: jest.fn().mockReturnValue(decrypted),
      }
      const operatorManager = {
        operatorForVersion: jest.fn().mockReturnValue(syncOperator),
      } as unknown as EncryptionOperatorsInterface

      const result = await decryptPayload(payload, key, operatorManager)

      expect(result).toEqual(decrypted)
      expect(syncOperator.generateDecryptedParameters).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: 'item-1', version: ProtocolVersion.V004 }),
        key,
      )
    })

    it('uses async operator when operator is async', async () => {
      const payload = createPayload(ProtocolVersion.V004)
      const key = createKey(ProtocolVersion.V004)
      const decrypted = { uuid: 'item-1', content: { text: 'hello' } }
      const asyncOperator = {
        generateEncryptedParametersAsync: jest.fn(),
        generateDecryptedParametersAsync: jest.fn().mockResolvedValue(decrypted),
      }
      const operatorManager = {
        operatorForVersion: jest.fn().mockReturnValue(asyncOperator),
      } as unknown as EncryptionOperatorsInterface

      const result = await decryptPayload(payload, key, operatorManager)

      expect(result).toEqual(decrypted)
      expect(asyncOperator.generateDecryptedParametersAsync).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: 'item-1', version: ProtocolVersion.V004 }),
        key,
      )
    })

    it('returns error when operator throws', async () => {
      const payload = createPayload(ProtocolVersion.V004)
      const key = createKey(ProtocolVersion.V004)
      const syncOperator = {
        generateDecryptedParameters: jest.fn().mockImplementation(() => {
          throw new Error('decryption failed')
        }),
      }
      const operatorManager = {
        operatorForVersion: jest.fn().mockReturnValue(syncOperator),
      } as unknown as EncryptionOperatorsInterface
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = await decryptPayload(payload, key, operatorManager)

      expect(result).toEqual({ uuid: 'item-1', errorDecrypting: true })
      consoleErrorSpy.mockRestore()
    })
  })
})

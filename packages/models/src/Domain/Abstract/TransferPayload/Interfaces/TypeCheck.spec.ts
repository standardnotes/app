import { ContentType } from '@standardnotes/domain-core'
import { PayloadTimestampDefaults } from '../../Payload'
import { isCorruptTransferPayload } from './TypeCheck'

describe('type check', () => {
  describe('isCorruptTransferPayload', () => {
    it('should return false if is valid', () => {
      expect(
        isCorruptTransferPayload({
          uuid: '123',
          content_type: ContentType.TYPES.Note,
          content: '123',
          ...PayloadTimestampDefaults(),
        }),
      ).toBe(false)
    })

    it('should return true if uuid is missing', () => {
      expect(
        isCorruptTransferPayload({
          uuid: undefined as never,
          content_type: ContentType.TYPES.Note,
          content: '123',
          ...PayloadTimestampDefaults(),
        }),
      ).toBe(true)
    })

    it('should return true if is deleted but has content', () => {
      expect(
        isCorruptTransferPayload({
          uuid: '123',
          content_type: ContentType.TYPES.Note,
          content: '123',
          deleted: true,
          ...PayloadTimestampDefaults(),
        }),
      ).toBe(true)
    })

    it('should return true if content type is unknown', () => {
      expect(
        isCorruptTransferPayload({
          uuid: '123',
          content_type: 'Unknown',
          content: '123',
          ...PayloadTimestampDefaults(),
        }),
      ).toBe(true)
    })
  })
})

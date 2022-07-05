import { NoteContent } from './../../../Syncable/Note/NoteContent'
import { ContentType } from '@standardnotes/common'
import { DecryptedItem } from '../../../Abstract/Item'
import { DecryptedPayload, PayloadTimestampDefaults } from '../../../Abstract/Payload'
import { ItemCollection } from './ItemCollection'
import { FillItemContent, ItemContent } from '../../../Abstract/Content/ItemContent'

describe('item collection', () => {
  const createDecryptedPayload = (uuid?: string): DecryptedPayload => {
    return new DecryptedPayload({
      uuid: uuid || String(Math.random()),
      content_type: ContentType.Note,
      content: FillItemContent<NoteContent>({
        title: 'foo',
      }),
      ...PayloadTimestampDefaults(),
    })
  }

  it('setting same item twice should not result in doubles', () => {
    const collection = new ItemCollection()

    const decryptedItem = new DecryptedItem(createDecryptedPayload())
    collection.set(decryptedItem)

    const updatedItem = new DecryptedItem(
      decryptedItem.payload.copy({
        content: { foo: 'bar' } as unknown as jest.Mocked<ItemContent>,
      }),
    )

    collection.set(updatedItem)

    expect(collection.all()).toHaveLength(1)
  })
})

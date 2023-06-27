import { NoteContent } from './../../../Syncable/Note/NoteContent'
import { ContentType } from '@standardnotes/common'
import { DecryptedItem } from '../../../Abstract/Item'
import { DecryptedPayload, PayloadTimestampDefaults } from '../../../Abstract/Payload'
import { ItemCollection } from './ItemCollection'
import { FillItemContent, ItemContent } from '../../../Abstract/Content/ItemContent'

describe('item collection', () => {
  const createDecryptedPayload = (uuid?: string, content?: Partial<NoteContent>): DecryptedPayload => {
    return new DecryptedPayload({
      uuid: uuid || String(Math.random()),
      content_type: ContentType.Note,
      content: FillItemContent<NoteContent>({
        title: 'foo',
        ...content,
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

  it('should not add conflicted copy to conflictMap if trashed', () => {
    const collection = new ItemCollection()

    const mainItem = new DecryptedItem(createDecryptedPayload())
    const nonTrashedConflictedItem = new DecryptedItem(
      createDecryptedPayload(undefined, {
        conflict_of: mainItem.uuid,
      }),
    )
    const trashedConflictedItem = new DecryptedItem(
      createDecryptedPayload(undefined, {
        conflict_of: mainItem.uuid,
        trashed: true,
      }),
    )

    collection.set([mainItem, nonTrashedConflictedItem, trashedConflictedItem])

    expect(collection.conflictMap.existsInDirectMap(mainItem.uuid)).toBe(true)
    expect(collection.conflictMap.getDirectRelationships(mainItem.uuid).includes(nonTrashedConflictedItem.uuid)).toBe(
      true,
    )
    expect(collection.conflictMap.getDirectRelationships(mainItem.uuid).includes(trashedConflictedItem.uuid)).toBe(
      false,
    )
  })
})

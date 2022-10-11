import { NoteContent } from '../../../Syncable/Note/NoteContent'
import { ContentType } from '@standardnotes/common'
import { DecryptedItem, EncryptedItem } from '../../../Abstract/Item'
import { DecryptedPayload, EncryptedPayload, PayloadTimestampDefaults } from '../../../Abstract/Payload'
import { ItemCollection } from './ItemCollection'
import { FillItemContent } from '../../../Abstract/Content/ItemContent'
import { TagItemsIndex } from './TagItemsIndex'
import { ItemDelta } from '../../Index/ItemDelta'
import { AnyItemInterface } from '../../../Abstract/Item/Interfaces/UnionTypes'

describe('tag notes index', () => {
  const createEncryptedItem = (uuid?: string) => {
    const payload = new EncryptedPayload({
      uuid: uuid || String(Math.random()),
      content_type: ContentType.Note,
      content: '004:...',
      enc_item_key: '004:...',
      items_key_id: '123',
      waitingForKey: true,
      errorDecrypting: true,
      ...PayloadTimestampDefaults(),
    })

    return new EncryptedItem(payload)
  }

  const createDecryptedItem = (uuid?: string) => {
    const payload = new DecryptedPayload({
      uuid: uuid || String(Math.random()),
      content_type: ContentType.Note,
      content: FillItemContent<NoteContent>({
        title: 'foo',
      }),
      ...PayloadTimestampDefaults(),
    })
    return new DecryptedItem(payload)
  }

  const createChangeDelta = (item: AnyItemInterface): ItemDelta => {
    return {
      changed: [item],
      inserted: [],
      discarded: [],
      ignored: [],
      unerrored: [],
    }
  }

  it('should decrement count after decrypted note becomes errored', () => {
    const collection = new ItemCollection()
    const index = new TagItemsIndex(collection)

    const decryptedItem = createDecryptedItem()
    collection.set(decryptedItem)
    index.onChange(createChangeDelta(decryptedItem))

    expect(index.allCountableItemsCount()).toEqual(1)

    const encryptedItem = createEncryptedItem(decryptedItem.uuid)
    collection.set(encryptedItem)
    index.onChange(createChangeDelta(encryptedItem))

    expect(index.allCountableItemsCount()).toEqual(0)
  })
})

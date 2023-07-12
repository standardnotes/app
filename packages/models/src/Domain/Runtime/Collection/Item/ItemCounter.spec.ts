import { ItemCounter } from './ItemCounter'
import { NoteContent } from '../../../Syncable/Note/NoteContent'
import { ContentType } from '@standardnotes/domain-core'
import { DecryptedItem, EncryptedItem } from '../../../Abstract/Item'
import { DecryptedPayload, EncryptedPayload, PayloadTimestampDefaults } from '../../../Abstract/Payload'
import { ItemCollection } from './ItemCollection'
import { FillItemContent } from '../../../Abstract/Content/ItemContent'
import { ItemDelta } from '../../Index/ItemDelta'
import { AnyItemInterface } from '../../../Abstract/Item/Interfaces/UnionTypes'

describe('tag notes index', () => {
  const createEncryptedItem = (uuid?: string) => {
    const payload = new EncryptedPayload({
      uuid: uuid || String(Math.random()),
      content_type: ContentType.TYPES.Note,
      content: '004:...',
      enc_item_key: '004:...',
      items_key_id: '123',
      waitingForKey: true,
      errorDecrypting: true,
      ...PayloadTimestampDefaults(),
    })

    return new EncryptedItem(payload)
  }

  const createDecryptedItem = (uuid?: string, content_type = ContentType.TYPES.Note) => {
    const payload = new DecryptedPayload({
      uuid: uuid || String(Math.random()),
      content_type,
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

  it('should count both notes and files', () => {
    const collection = new ItemCollection()
    const index = new ItemCounter(collection)

    const decryptedNote = createDecryptedItem('note')
    const decryptedFile = createDecryptedItem('file')
    collection.set([decryptedNote, decryptedFile])
    index.onChange(createChangeDelta(decryptedNote))
    index.onChange(createChangeDelta(decryptedFile))

    expect(index.allCountableItemsCount()).toEqual(2)
  })

  it('should decrement count after decrypted note becomes errored', () => {
    const collection = new ItemCollection()
    const index = new ItemCounter(collection)

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

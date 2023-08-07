import { BaseItemCounts } from '../lib/BaseItemCounts.js'
import * as Factory from '../lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('app models', () => {
  let application
  let expectedItemCount
  let context

  beforeEach(async function () {
    localStorage.clear()
    expectedItemCount = BaseItemCounts.DefaultItems
    context = await Factory.createAppContext()
    application = context.application
    await context.launch()
  })

  afterEach(async function () {
    await context.deinit()
    localStorage.clear()
    sinon.restore()
  })

  it('item should be defined', () => {
    expect(GenericItem).to.be.ok
  })

  it('item content should be assigned', () => {
    const params = Factory.createNotePayload()
    const item = CreateDecryptedItemFromPayload(params)
    expect(item.content.title).to.equal(params.content.title)
  })

  it('should default updated_at to 1970 and created_at to the present', () => {
    const params = Factory.createNotePayload()
    const item = CreateDecryptedItemFromPayload(params)
    const epoch = new Date(0)
    expect(item.serverUpdatedAt - epoch).to.equal(0)
    expect(item.created_at - epoch).to.be.above(0)

    const presentThresholdMs = 10
    expect(new Date() - item.created_at).to.be.below(presentThresholdMs)
  })

  it('handles delayed mapping', async function () {
    const params1 = Factory.createNotePayload()
    const params2 = Factory.createNotePayload()

    const mutated = new DecryptedPayload({
      ...params1,
      content: {
        ...params1.content,
        references: [
          {
            uuid: params2.uuid,
            content_type: params2.content_type,
          },
        ],
      },
    })

    await application.mutator.emitItemsFromPayloads([mutated], PayloadEmitSource.LocalChanged)
    await application.mutator.emitItemsFromPayloads([params2], PayloadEmitSource.LocalChanged)

    const item1 = application.items.findItem(params1.uuid)
    const item2 = application.items.findItem(params2.uuid)

    expect(item1.content.references.length).to.equal(1)
    expect(item2.content.references.length).to.equal(0)

    expect(application.items.itemsReferencingItem(item1).length).to.equal(0)
    expect(application.items.itemsReferencingItem(item2).length).to.equal(1)
  })

  it('mapping an item twice shouldnt cause problems', async function () {
    const payload = Factory.createNotePayload()
    const mutated = new DecryptedPayload({
      ...payload,
      content: {
        ...payload.content,
        foo: 'bar',
      },
    })

    let items = await application.mutator.emitItemsFromPayloads([mutated], PayloadEmitSource.LocalChanged)
    let item = items[0]
    expect(item).to.be.ok

    items = await application.mutator.emitItemsFromPayloads([mutated], PayloadEmitSource.LocalChanged)
    item = items[0]

    expect(item.content.foo).to.equal('bar')
    expect(application.items.getDisplayableNotes().length).to.equal(1)
  })

  it('mapping item twice should preserve references', async function () {
    const item1 = await Factory.createMappedNote(application)
    const item2 = await Factory.createMappedNote(application)

    await application.mutator.changeItem(item1, (mutator) => {
      mutator.e2ePendingRefactor_addItemAsRelationship(item2)
    })
    await application.mutator.changeItem(item2, (mutator) => {
      mutator.e2ePendingRefactor_addItemAsRelationship(item1)
    })

    const refreshedItem = application.items.findItem(item1.uuid)
    expect(refreshedItem.content.references.length).to.equal(1)
  })

  it('fixes relationship integrity', async function () {
    var item1 = await Factory.createMappedNote(application)
    var item2 = await Factory.createMappedNote(application)

    await application.mutator.changeItem(item1, (mutator) => {
      mutator.e2ePendingRefactor_addItemAsRelationship(item2)
    })
    await application.mutator.changeItem(item2, (mutator) => {
      mutator.e2ePendingRefactor_addItemAsRelationship(item1)
    })

    const refreshedItem1 = application.items.findItem(item1.uuid)
    const refreshedItem2 = application.items.findItem(item2.uuid)

    expect(refreshedItem1.content.references.length).to.equal(1)
    expect(refreshedItem2.content.references.length).to.equal(1)

    const damagedPayload = refreshedItem1.payload.copy({
      content: {
        ...refreshedItem1.content,
        // damage references of one object
        references: [],
      },
    })
    await application.mutator.emitItemsFromPayloads([damagedPayload], PayloadEmitSource.LocalChanged)

    const refreshedItem1_2 = application.items.findItem(item1.uuid)
    const refreshedItem2_2 = application.items.findItem(item2.uuid)

    expect(refreshedItem1_2.content.references.length).to.equal(0)
    expect(refreshedItem2_2.content.references.length).to.equal(1)
  })

  it('creating and removing relationships between two items should have valid references', async function () {
    var item1 = await Factory.createMappedNote(application)
    var item2 = await Factory.createMappedNote(application)
    await application.mutator.changeItem(item1, (mutator) => {
      mutator.e2ePendingRefactor_addItemAsRelationship(item2)
    })
    await application.mutator.changeItem(item2, (mutator) => {
      mutator.e2ePendingRefactor_addItemAsRelationship(item1)
    })

    const refreshedItem1 = application.items.findItem(item1.uuid)
    const refreshedItem2 = application.items.findItem(item2.uuid)

    expect(refreshedItem1.content.references.length).to.equal(1)
    expect(refreshedItem2.content.references.length).to.equal(1)

    expect(application.items.itemsReferencingItem(item1)).to.include(refreshedItem2)
    expect(application.items.itemsReferencingItem(item2)).to.include(refreshedItem1)

    await application.mutator.changeItem(item1, (mutator) => {
      mutator.removeItemAsRelationship(item2)
    })
    await application.mutator.changeItem(item2, (mutator) => {
      mutator.removeItemAsRelationship(item1)
    })

    const refreshedItem1_2 = application.items.findItem(item1.uuid)
    const refreshedItem2_2 = application.items.findItem(item2.uuid)

    expect(refreshedItem1_2.content.references.length).to.equal(0)
    expect(refreshedItem2_2.content.references.length).to.equal(0)

    expect(application.items.itemsReferencingItem(item1).length).to.equal(0)
    expect(application.items.itemsReferencingItem(item2).length).to.equal(0)
  })

  it('properly duplicates item with no relationships', async function () {
    const item = await Factory.createMappedNote(application)
    const duplicate = await application.mutator.duplicateItem(item)
    expect(duplicate.uuid).to.not.equal(item.uuid)
    expect(item.isItemContentEqualWith(duplicate)).to.equal(true)
    expect(item.created_at.toISOString()).to.equal(duplicate.created_at.toISOString())
    expect(item.content_type).to.equal(duplicate.content_type)
  })

  it('properly duplicates item with relationships', async function () {
    const item1 = await Factory.createMappedNote(application)
    const item2 = await Factory.createMappedNote(application)

    const refreshedItem1 = await application.mutator.changeItem(item1, (mutator) => {
      mutator.e2ePendingRefactor_addItemAsRelationship(item2)
    })

    expect(refreshedItem1.content.references.length).to.equal(1)

    const duplicate = await application.mutator.duplicateItem(item1)
    expect(duplicate.uuid).to.not.equal(item1.uuid)
    expect(duplicate.content.references.length).to.equal(1)

    expect(application.items.itemsReferencingItem(item1).length).to.equal(0)
    expect(application.items.itemsReferencingItem(item2).length).to.equal(2)

    const refreshedItem1_2 = application.items.findItem(item1.uuid)
    expect(refreshedItem1_2.isItemContentEqualWith(duplicate)).to.equal(true)
    expect(refreshedItem1_2.created_at.toISOString()).to.equal(duplicate.created_at.toISOString())
    expect(refreshedItem1_2.content_type).to.equal(duplicate.content_type)
  })

  it('removing references should update cross-refs', async function () {
    const item1 = await Factory.createMappedNote(application)
    const item2 = await Factory.createMappedNote(application)
    const refreshedItem1 = await application.mutator.changeItem(item1, (mutator) => {
      mutator.e2ePendingRefactor_addItemAsRelationship(item2)
    })

    const refreshedItem1_2 = await application.mutator.emitItemFromPayload(
      refreshedItem1.payloadRepresentation({
        deleted: true,
        content: {
          ...refreshedItem1.payload.content,
          references: [],
        },
      }),
      PayloadEmitSource.LocalChanged,
    )

    expect(application.items.itemsReferencingItem(item2).length).to.equal(0)
    expect(application.items.itemsReferencingItem(item1).length).to.equal(0)
    expect(refreshedItem1_2.content.references.length).to.equal(0)
  })

  it('properly handles single item uuid alternation', async function () {
    const item1 = await Factory.createMappedNote(application)
    const item2 = await Factory.createMappedNote(application)

    const refreshedItem1 = await application.mutator.changeItem(item1, (mutator) => {
      mutator.e2ePendingRefactor_addItemAsRelationship(item2)
    })

    expect(refreshedItem1.content.references.length).to.equal(1)
    expect(application.items.itemsReferencingItem(item2).length).to.equal(1)

    const alternatedItem = await Factory.alternateUuidForItem(application, item1.uuid)
    const refreshedItem1_2 = application.items.findItem(item1.uuid)
    expect(refreshedItem1_2).to.not.be.ok

    expect(application.items.getDisplayableNotes().length).to.equal(2)

    expect(alternatedItem.content.references.length).to.equal(1)
    expect(application.items.itemsReferencingItem(alternatedItem.uuid).length).to.equal(0)

    expect(application.items.itemsReferencingItem(item2).length).to.equal(1)

    expect(alternatedItem.isReferencingItem(item2)).to.equal(true)
    expect(alternatedItem.dirty).to.equal(true)
  })

  it('alterating uuid of item should fill its duplicateOf value', async function () {
    const item1 = await Factory.createMappedNote(application)
    const alternatedItem = await Factory.alternateUuidForItem(application, item1.uuid)
    expect(alternatedItem.duplicateOf).to.equal(item1.uuid)
  })

  it('alterating itemskey uuid should update errored items encrypted with that key', async function () {
    const item1 = await Factory.createMappedNote(application)
    const itemsKey = application.items.getDisplayableItemsKeys()[0]

    /** Encrypt item1 and emit as errored so it persists with items_key_id */
    const encrypted = await application.encryption.encryptSplitSingle({
      usesItemsKeyWithKeyLookup: {
        items: [item1.payload],
      },
    })
    const errored = encrypted.copy({
      errorDecrypting: true,
      waitingForKey: true,
    })

    await application.payloads.emitPayload(errored)

    expect(application.payloads.findOne(item1.uuid).errorDecrypting).to.equal(true)
    expect(application.payloads.findOne(item1.uuid).items_key_id).to.equal(itemsKey.uuid)

    sinon.stub(application.encryption.itemsEncryption, 'decryptErroredItemPayloads').callsFake(() => {
      // prevent auto decryption
    })

    const alternatedKey = await Factory.alternateUuidForItem(application, itemsKey.uuid)
    const updatedPayload = application.payloads.findOne(item1.uuid)

    expect(updatedPayload.items_key_id).to.equal(alternatedKey.uuid)
  })

  it('properly handles mutli item uuid alternation', async function () {
    const item1 = await Factory.createMappedNote(application)
    const item2 = await Factory.createMappedNote(application)
    expectedItemCount += 2

    await application.mutator.changeItem(item1, (mutator) => {
      mutator.e2ePendingRefactor_addItemAsRelationship(item2)
    })

    expect(application.items.itemsReferencingItem(item2).length).to.equal(1)

    const alternatedItem1 = await Factory.alternateUuidForItem(application, item1.uuid)
    const alternatedItem2 = await Factory.alternateUuidForItem(application, item2.uuid)

    expect(application.items.items.length).to.equal(expectedItemCount)

    expect(item1.uuid).to.not.equal(alternatedItem1.uuid)
    expect(item2.uuid).to.not.equal(alternatedItem2.uuid)

    const refreshedAltItem1 = application.items.findItem(alternatedItem1.uuid)
    expect(refreshedAltItem1.content.references.length).to.equal(1)
    expect(refreshedAltItem1.content.references[0].uuid).to.equal(alternatedItem2.uuid)
    expect(alternatedItem2.content.references.length).to.equal(0)

    expect(application.items.itemsReferencingItem(alternatedItem2).length).to.equal(1)

    expect(refreshedAltItem1.isReferencingItem(alternatedItem2)).to.equal(true)
    expect(alternatedItem2.isReferencingItem(refreshedAltItem1)).to.equal(false)
    expect(refreshedAltItem1.dirty).to.equal(true)
  })

  it('maintains referencing relationships when duplicating', async function () {
    const tag = await Factory.createMappedTag(application)
    const note = await Factory.createMappedNote(application)
    const refreshedTag = await application.mutator.changeItem(tag, (mutator) => {
      mutator.e2ePendingRefactor_addItemAsRelationship(note)
    })

    expect(refreshedTag.content.references.length).to.equal(1)

    const noteCopy = await application.mutator.duplicateItem(note)
    expect(note.uuid).to.not.equal(noteCopy.uuid)

    expect(application.items.getDisplayableNotes().length).to.equal(2)
    expect(application.items.getDisplayableTags().length).to.equal(1)

    expect(note.content.references.length).to.equal(0)
    expect(noteCopy.content.references.length).to.equal(0)
    const refreshedTag_2 = application.items.findItem(tag.uuid)
    expect(refreshedTag_2.content.references.length).to.equal(2)
  })

  it('maintains editor reference when duplicating note', async function () {
    const component = await application.mutator.createItem(
      ContentType.TYPES.Component,
      { area: ComponentArea.Editor, package_info: { identifier: 'foo-editor' } },
      true,
    )
    const note = await Factory.insertItemWithOverride(application, ContentType.TYPES.Note, {
      editorIdentifier: 'foo-editor',
    })

    expect(application.componentManager.editorForNote(note).uniqueIdentifier.value).to.equal(component.uuid)

    const duplicate = await application.mutator.duplicateItem(note, true)
    expect(application.componentManager.editorForNote(duplicate).uniqueIdentifier.value).to.equal(component.uuid)
  })
})

import { BaseItemCounts } from '../lib/BaseItemCounts.js'
import * as Factory from '../lib/factory.js'
import { createNoteParams } from '../lib/Items.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('model manager mapping', () => {
  let application
  let expectedItemCount
  let context

  beforeEach(async function () {
    localStorage.clear()
    expectedItemCount = BaseItemCounts.DefaultItems
    context = await Factory.createAppContext()
    await context.launch()
    application = context.application
  })

  afterEach(async function () {
    await Factory.safeDeinit(application)
    application = undefined
    context = undefined
    localStorage.clear()
  })

  it('mapping nonexistent item creates it', async function () {
    const payload = Factory.createNotePayload()
    await application.mutator.emitItemsFromPayloads([payload], PayloadEmitSource.LocalChanged)
    expectedItemCount++
    expect(application.items.items.length).to.equal(expectedItemCount)
  })

  it('mapping nonexistent deleted item doesnt create it', async function () {
    const payload = new DeletedPayload({
      ...createNoteParams(),
      dirty: false,
      deleted: true,
    })
    await application.payloads.emitPayload(payload, PayloadEmitSource.LocalChanged)
    expect(application.items.items.length).to.equal(expectedItemCount)
  })

  it('mapping and deleting nonexistent item creates and deletes it', async function () {
    const payload = Factory.createNotePayload()
    await application.mutator.emitItemsFromPayloads([payload], PayloadEmitSource.LocalChanged)

    expectedItemCount++

    expect(application.items.items.length).to.equal(expectedItemCount)

    const changedParams = new DeletedPayload({
      ...payload,
      dirty: false,
      deleted: true,
    })

    expectedItemCount--

    await application.mutator.emitItemsFromPayloads([changedParams], PayloadEmitSource.LocalChanged)

    expect(application.items.items.length).to.equal(expectedItemCount)
  })

  it('mapping deleted but dirty item should not delete it', async function () {
    const payload = Factory.createNotePayload()

    const [item] = await application.mutator.emitItemsFromPayloads([payload], PayloadEmitSource.LocalChanged)

    expectedItemCount++

    await application.payloads.emitPayload(new DeleteItemMutator(item).getDeletedResult())

    const payload2 = new DeletedPayload(application.payloads.findOne(payload.uuid).ejected())

    await application.payloads.emitPayloads([payload2], PayloadEmitSource.LocalChanged)

    expect(application.payloads.collection.all().length).to.equal(expectedItemCount)
  })

  it('mapping existing item updates its properties', async function () {
    const payload = Factory.createNotePayload()
    await application.mutator.emitItemsFromPayloads([payload], PayloadEmitSource.LocalChanged)

    const newTitle = 'updated title'
    const mutated = new DecryptedPayload({
      ...payload,
      content: {
        ...payload.content,
        title: newTitle,
      },
    })
    await application.mutator.emitItemsFromPayloads([mutated], PayloadEmitSource.LocalChanged)
    const item = application.items.getDisplayableNotes()[0]

    expect(item.content.title).to.equal(newTitle)
  })

  it('setting an item dirty should retrieve it in dirty items', async function () {
    const payload = Factory.createNotePayload()
    await application.mutator.emitItemsFromPayloads([payload], PayloadEmitSource.LocalChanged)
    const note = application.items.getDisplayableNotes()[0]
    await application.mutator.setItemDirty(note)
    const dirtyItems = application.items.getDirtyItems()
    expect(Uuids(dirtyItems).includes(note.uuid))
  })

  it('set all items dirty', async function () {
    const count = 10
    expectedItemCount += count
    const payloads = []
    for (let i = 0; i < count; i++) {
      payloads.push(Factory.createNotePayload())
    }
    await application.mutator.emitItemsFromPayloads(payloads, PayloadEmitSource.LocalChanged)
    await application.sync.markAllItemsAsNeedingSyncAndPersist()

    const dirtyItems = application.items.getDirtyItems()
    expect(dirtyItems.length).to.equal(expectedItemCount)
  })

  it('sync observers should be notified of changes', async function () {
    const payload = Factory.createNotePayload()
    await application.mutator.emitItemsFromPayloads([payload], PayloadEmitSource.LocalChanged)
    const item = application.items.items[0]
    return new Promise((resolve) => {
      application.items.addObserver(ContentType.TYPES.Any, ({ changed }) => {
        expect(changed[0].uuid === item.uuid)
        resolve()
      })
      application.mutator.emitItemsFromPayloads([payload], PayloadEmitSource.LocalChanged)
    })
  })
})

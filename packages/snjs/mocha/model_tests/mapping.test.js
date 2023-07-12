/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import { BaseItemCounts } from '../lib/BaseItemCounts.js'
import * as Factory from '../lib/factory.js'
import { createNoteParams } from '../lib/Items.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('model manager mapping', () => {
  beforeEach(async function () {
    this.expectedItemCount = BaseItemCounts.DefaultItems
    this.context = await Factory.createAppContext()
    await this.context.launch()
    this.application = this.context.application
  })

  afterEach(async function () {
    await Factory.safeDeinit(this.application)
  })

  it('mapping nonexistent item creates it', async function () {
    const payload = Factory.createNotePayload()
    await this.application.mutator.emitItemsFromPayloads([payload], PayloadEmitSource.LocalChanged)
    this.expectedItemCount++
    expect(this.application.itemManager.items.length).to.equal(this.expectedItemCount)
  })

  it('mapping nonexistent deleted item doesnt create it', async function () {
    const payload = new DeletedPayload({
      ...createNoteParams(),
      dirty: false,
      deleted: true,
    })
    await this.application.payloadManager.emitPayload(payload, PayloadEmitSource.LocalChanged)
    expect(this.application.itemManager.items.length).to.equal(this.expectedItemCount)
  })

  it('mapping and deleting nonexistent item creates and deletes it', async function () {
    const payload = Factory.createNotePayload()
    await this.application.mutator.emitItemsFromPayloads([payload], PayloadEmitSource.LocalChanged)

    this.expectedItemCount++

    expect(this.application.itemManager.items.length).to.equal(this.expectedItemCount)

    const changedParams = new DeletedPayload({
      ...payload,
      dirty: false,
      deleted: true,
    })

    this.expectedItemCount--

    await this.application.mutator.emitItemsFromPayloads([changedParams], PayloadEmitSource.LocalChanged)

    expect(this.application.itemManager.items.length).to.equal(this.expectedItemCount)
  })

  it('mapping deleted but dirty item should not delete it', async function () {
    const payload = Factory.createNotePayload()

    const [item] = await this.application.mutator.emitItemsFromPayloads([payload], PayloadEmitSource.LocalChanged)

    this.expectedItemCount++

    await this.application.payloadManager.emitPayload(new DeleteItemMutator(item).getDeletedResult())

    const payload2 = new DeletedPayload(this.application.payloadManager.findOne(payload.uuid).ejected())

    await this.application.payloadManager.emitPayloads([payload2], PayloadEmitSource.LocalChanged)

    expect(this.application.payloadManager.collection.all().length).to.equal(this.expectedItemCount)
  })

  it('mapping existing item updates its properties', async function () {
    const payload = Factory.createNotePayload()
    await this.application.mutator.emitItemsFromPayloads([payload], PayloadEmitSource.LocalChanged)

    const newTitle = 'updated title'
    const mutated = new DecryptedPayload({
      ...payload,
      content: {
        ...payload.content,
        title: newTitle,
      },
    })
    await this.application.mutator.emitItemsFromPayloads([mutated], PayloadEmitSource.LocalChanged)
    const item = this.application.itemManager.getDisplayableNotes()[0]

    expect(item.content.title).to.equal(newTitle)
  })

  it('setting an item dirty should retrieve it in dirty items', async function () {
    const payload = Factory.createNotePayload()
    await this.application.mutator.emitItemsFromPayloads([payload], PayloadEmitSource.LocalChanged)
    const note = this.application.itemManager.getDisplayableNotes()[0]
    await this.application.mutator.setItemDirty(note)
    const dirtyItems = this.application.itemManager.getDirtyItems()
    expect(Uuids(dirtyItems).includes(note.uuid))
  })

  it('set all items dirty', async function () {
    const count = 10
    this.expectedItemCount += count
    const payloads = []
    for (let i = 0; i < count; i++) {
      payloads.push(Factory.createNotePayload())
    }
    await this.application.mutator.emitItemsFromPayloads(payloads, PayloadEmitSource.LocalChanged)
    await this.application.syncService.markAllItemsAsNeedingSyncAndPersist()

    const dirtyItems = this.application.itemManager.getDirtyItems()
    expect(dirtyItems.length).to.equal(this.expectedItemCount)
  })

  it('sync observers should be notified of changes', async function () {
    const payload = Factory.createNotePayload()
    await this.application.mutator.emitItemsFromPayloads([payload], PayloadEmitSource.LocalChanged)
    const item = this.application.itemManager.items[0]
    return new Promise((resolve) => {
      this.application.itemManager.addObserver(ContentType.TYPES.Any, ({ changed }) => {
        expect(changed[0].uuid === item.uuid)
        resolve()
      })
      this.application.mutator.emitItemsFromPayloads([payload], PayloadEmitSource.LocalChanged)
    })
  })
})

import { BaseItemCounts } from '../lib/BaseItemCounts.js'
import * as Factory from '../lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('items', () => {
  const syncOptions = {
    checkIntegrity: true,
    awaitAll: true,
  }

  let application
  let expectedItemCount

  beforeEach(async function () {
    localStorage.clear()
    expectedItemCount = BaseItemCounts.DefaultItems
    application = await Factory.createInitAppWithFakeCrypto()
  })

  afterEach(async function () {
    await Factory.safeDeinit(application)
    localStorage.clear()
  })

  it('setting an item as dirty should update its client updated at', async function () {
    const params = Factory.createNotePayload()
    await application.mutator.emitItemsFromPayloads([params], PayloadEmitSource.LocalChanged)
    const item = application.items.items[0]
    const prevDate = item.userModifiedDate.getTime()
    await Factory.sleep(0.1)
    await application.mutator.setItemDirty(item, true)
    const refreshedItem = application.items.findItem(item.uuid)
    const newDate = refreshedItem.userModifiedDate.getTime()
    expect(prevDate).to.not.equal(newDate)
  })

  it('setting an item as dirty with option to skip client updated at', async function () {
    const params = Factory.createNotePayload()
    await application.mutator.emitItemsFromPayloads([params], PayloadEmitSource.LocalChanged)
    const item = application.items.items[0]
    const prevDate = item.userModifiedDate.getTime()
    await Factory.sleep(0.1)
    await application.mutator.setItemDirty(item)
    const newDate = item.userModifiedDate.getTime()
    expect(prevDate).to.equal(newDate)
  })

  it('properly pins, archives, and locks', async function () {
    const params = Factory.createNotePayload()
    await application.mutator.emitItemsFromPayloads([params], PayloadEmitSource.LocalChanged)

    const item = application.items.items[0]
    expect(item.pinned).to.not.be.ok

    const refreshedItem = (
      await application.changeAndSaveItem.execute(
        item,
        (mutator) => {
          mutator.pinned = true
          mutator.archived = true
          mutator.locked = true
        },
        undefined,
        undefined,
        syncOptions,
      )
    ).getValue()
    expect(refreshedItem.pinned).to.equal(true)
    expect(refreshedItem.archived).to.equal(true)
    expect(refreshedItem.locked).to.equal(true)
  })

  it('properly compares item equality', async function () {
    const params1 = Factory.createNotePayload()
    const params2 = Factory.createNotePayload()
    await application.mutator.emitItemsFromPayloads([params1, params2], PayloadEmitSource.LocalChanged)

    let item1 = application.items.getDisplayableNotes()[0]
    let item2 = application.items.getDisplayableNotes()[1]

    expect(item1.isItemContentEqualWith(item2)).to.equal(true)

    // items should ignore this field when checking for equality
    item1 = (
      await application.changeAndSaveItem.execute(
        item1,
        (mutator) => {
          mutator.userModifiedDate = new Date()
        },
        undefined,
        undefined,
        syncOptions,
      )
    ).getValue()
    item2 = (
      await application.changeAndSaveItem.execute(
        item2,
        (mutator) => {
          mutator.userModifiedDate = undefined
        },
        undefined,
        undefined,
        syncOptions,
      )
    ).getValue()

    expect(item1.isItemContentEqualWith(item2)).to.equal(true)

    item1 = (
      await application.changeAndSaveItem.execute(
        item1,
        (mutator) => {
          mutator.mutableContent.foo = 'bar'
        },
        undefined,
        undefined,
        syncOptions,
      )
    ).getValue()

    expect(item1.isItemContentEqualWith(item2)).to.equal(false)

    item2 = (
      await application.changeAndSaveItem.execute(
        item2,
        (mutator) => {
          mutator.mutableContent.foo = 'bar'
        },
        undefined,
        undefined,
        syncOptions,
      )
    ).getValue()

    expect(item1.isItemContentEqualWith(item2)).to.equal(true)
    expect(item2.isItemContentEqualWith(item1)).to.equal(true)

    item1 = (
      await application.changeAndSaveItem.execute(
        item1,
        (mutator) => {
          mutator.e2ePendingRefactor_addItemAsRelationship(item2)
        },
        undefined,
        undefined,
        syncOptions,
      )
    ).getValue()
    item2 = (
      await application.changeAndSaveItem.execute(
        item2,
        (mutator) => {
          mutator.e2ePendingRefactor_addItemAsRelationship(item1)
        },
        undefined,
        undefined,
        syncOptions,
      )
    ).getValue()

    expect(item1.content.references.length).to.equal(1)
    expect(item2.content.references.length).to.equal(1)

    expect(item1.isItemContentEqualWith(item2)).to.equal(false)

    item1 = (
      await application.changeAndSaveItem.execute(
        item1,
        (mutator) => {
          mutator.removeItemAsRelationship(item2)
        },
        undefined,
        undefined,
        syncOptions,
      )
    ).getValue()
    item2 = (
      await application.changeAndSaveItem.execute(
        item2,
        (mutator) => {
          mutator.removeItemAsRelationship(item1)
        },
        undefined,
        undefined,
        syncOptions,
      )
    ).getValue()

    expect(item1.isItemContentEqualWith(item2)).to.equal(true)
    expect(item1.content.references.length).to.equal(0)
    expect(item2.content.references.length).to.equal(0)
  })

  it('content equality should not have side effects', async function () {
    const params1 = Factory.createNotePayload()
    const params2 = Factory.createNotePayload()
    await application.mutator.emitItemsFromPayloads([params1, params2], PayloadEmitSource.LocalChanged)

    let item1 = application.items.getDisplayableNotes()[0]
    const item2 = application.items.getDisplayableNotes()[1]

    item1 = (
      await application.changeAndSaveItem.execute(
        item1,
        (mutator) => {
          mutator.mutableContent.foo = 'bar'
        },
        undefined,
        undefined,
        syncOptions,
      )
    ).getValue()

    expect(item1.content.foo).to.equal('bar')

    item1.contentKeysToIgnoreWhenCheckingEquality = () => {
      return ['foo']
    }

    item2.contentKeysToIgnoreWhenCheckingEquality = () => {
      return ['foo']
    }

    // calling isItemContentEqualWith should not have side effects
    // There was an issue where calling that function would modify values directly to omit keys
    // in contentKeysToIgnoreWhenCheckingEquality.

    await application.mutator.setItemsDirty([item1, item2])

    expect(item1.userModifiedDate).to.be.ok
    expect(item2.userModifiedDate).to.be.ok

    expect(item1.isItemContentEqualWith(item2)).to.equal(true)
    expect(item2.isItemContentEqualWith(item1)).to.equal(true)

    expect(item1.userModifiedDate).to.be.ok
    expect(item2.userModifiedDate).to.be.ok

    expect(item1.content.foo).to.equal('bar')
  })
})

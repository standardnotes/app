/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import * as Factory from '../lib/factory.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('items', () => {
  const BASE_ITEM_COUNT = 2 /** Default items key, user preferences */

  const syncOptions = {
    checkIntegrity: true,
    awaitAll: true,
  }

  beforeEach(async function () {
    this.expectedItemCount = BASE_ITEM_COUNT
    this.application = await Factory.createInitAppWithFakeCrypto()
  })

  afterEach(async function () {
    await Factory.safeDeinit(this.application)
  })

  it('setting an item as dirty should update its client updated at', async function () {
    const params = Factory.createNotePayload()
    await this.application.itemManager.emitItemsFromPayloads([params], PayloadEmitSource.LocalChanged)
    const item = this.application.itemManager.items[0]
    const prevDate = item.userModifiedDate.getTime()
    await Factory.sleep(0.1)
    await this.application.itemManager.setItemDirty(item, true)
    const refreshedItem = this.application.itemManager.findItem(item.uuid)
    const newDate = refreshedItem.userModifiedDate.getTime()
    expect(prevDate).to.not.equal(newDate)
  })

  it('setting an item as dirty with option to skip client updated at', async function () {
    const params = Factory.createNotePayload()
    await this.application.itemManager.emitItemsFromPayloads([params], PayloadEmitSource.LocalChanged)
    const item = this.application.itemManager.items[0]
    const prevDate = item.userModifiedDate.getTime()
    await Factory.sleep(0.1)
    await this.application.itemManager.setItemDirty(item)
    const newDate = item.userModifiedDate.getTime()
    expect(prevDate).to.equal(newDate)
  })

  it('properly pins, archives, and locks', async function () {
    const params = Factory.createNotePayload()
    await this.application.itemManager.emitItemsFromPayloads([params], PayloadEmitSource.LocalChanged)

    const item = this.application.itemManager.items[0]
    expect(item.pinned).to.not.be.ok

    const refreshedItem = await this.application.mutator.changeAndSaveItem(
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
    expect(refreshedItem.pinned).to.equal(true)
    expect(refreshedItem.archived).to.equal(true)
    expect(refreshedItem.locked).to.equal(true)
  })

  it('properly compares item equality', async function () {
    const params1 = Factory.createNotePayload()
    const params2 = Factory.createNotePayload()
    await this.application.itemManager.emitItemsFromPayloads([params1, params2], PayloadEmitSource.LocalChanged)

    let item1 = this.application.itemManager.getDisplayableNotes()[0]
    let item2 = this.application.itemManager.getDisplayableNotes()[1]

    expect(item1.isItemContentEqualWith(item2)).to.equal(true)

    // items should ignore this field when checking for equality
    item1 = await this.application.mutator.changeAndSaveItem(
      item1,
      (mutator) => {
        mutator.userModifiedDate = new Date()
      },
      undefined,
      undefined,
      syncOptions,
    )
    item2 = await this.application.mutator.changeAndSaveItem(
      item2,
      (mutator) => {
        mutator.userModifiedDate = undefined
      },
      undefined,
      undefined,
      syncOptions,
    )

    expect(item1.isItemContentEqualWith(item2)).to.equal(true)

    item1 = await this.application.mutator.changeAndSaveItem(
      item1,
      (mutator) => {
        mutator.mutableContent.foo = 'bar'
      },
      undefined,
      undefined,
      syncOptions,
    )

    expect(item1.isItemContentEqualWith(item2)).to.equal(false)

    item2 = await this.application.mutator.changeAndSaveItem(
      item2,
      (mutator) => {
        mutator.mutableContent.foo = 'bar'
      },
      undefined,
      undefined,
      syncOptions,
    )

    expect(item1.isItemContentEqualWith(item2)).to.equal(true)
    expect(item2.isItemContentEqualWith(item1)).to.equal(true)

    item1 = await this.application.mutator.changeAndSaveItem(
      item1,
      (mutator) => {
        mutator.e2ePendingRefactor_addItemAsRelationship(item2)
      },
      undefined,
      undefined,
      syncOptions,
    )
    item2 = await this.application.mutator.changeAndSaveItem(
      item2,
      (mutator) => {
        mutator.e2ePendingRefactor_addItemAsRelationship(item1)
      },
      undefined,
      undefined,
      syncOptions,
    )

    expect(item1.content.references.length).to.equal(1)
    expect(item2.content.references.length).to.equal(1)

    expect(item1.isItemContentEqualWith(item2)).to.equal(false)

    item1 = await this.application.mutator.changeAndSaveItem(
      item1,
      (mutator) => {
        mutator.removeItemAsRelationship(item2)
      },
      undefined,
      undefined,
      syncOptions,
    )
    item2 = await this.application.mutator.changeAndSaveItem(
      item2,
      (mutator) => {
        mutator.removeItemAsRelationship(item1)
      },
      undefined,
      undefined,
      syncOptions,
    )

    expect(item1.isItemContentEqualWith(item2)).to.equal(true)
    expect(item1.content.references.length).to.equal(0)
    expect(item2.content.references.length).to.equal(0)
  })

  it('content equality should not have side effects', async function () {
    const params1 = Factory.createNotePayload()
    const params2 = Factory.createNotePayload()
    await this.application.itemManager.emitItemsFromPayloads([params1, params2], PayloadEmitSource.LocalChanged)

    let item1 = this.application.itemManager.getDisplayableNotes()[0]
    const item2 = this.application.itemManager.getDisplayableNotes()[1]

    item1 = await this.application.mutator.changeAndSaveItem(
      item1,
      (mutator) => {
        mutator.mutableContent.foo = 'bar'
      },
      undefined,
      undefined,
      syncOptions,
    )

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

    await this.application.itemManager.setItemsDirty([item1, item2])

    expect(item1.userModifiedDate).to.be.ok
    expect(item2.userModifiedDate).to.be.ok

    expect(item1.isItemContentEqualWith(item2)).to.equal(true)
    expect(item2.isItemContentEqualWith(item1)).to.equal(true)

    expect(item1.userModifiedDate).to.be.ok
    expect(item2.userModifiedDate).to.be.ok

    expect(item1.content.foo).to.equal('bar')
  })
})

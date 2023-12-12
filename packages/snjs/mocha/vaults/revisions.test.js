import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('shared vault revisions', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let context
  let deinitContactContextFunction

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createVaultsContextWithRealCrypto()

    await context.launch()
    await context.register()

    /**
     * Free user revisions are limited to 1 per day. This is to ensure that
     * we don't hit that limit during testing.
     */
    await context.activatePaidSubscriptionForUser()
  })

  afterEach(async function () {
    await context.deinit()
    if (deinitContactContextFunction) {
      await deinitContactContextFunction()
    }
    localStorage.clear()
    sinon.restore()
    context = undefined
    deinitContactContextFunction = undefined
  })

  it('should be able to access shared item revisions as third party user', async () => {
    const { note, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)
    deinitContactContextFunction = deinitContactContext

    await contactContext.activatePaidSubscriptionForUser()

    await Factory.sleep(Factory.ServerRevisionFrequency)

    await context.changeNoteTitleAndSync(note, 'new title 1')

    await Factory.sleep(Factory.ServerRevisionFrequency)

    await context.changeNoteTitleAndSync(note, 'new title 2')

    await Factory.sleep(Factory.ServerRevisionCreationDelay)

    const contactItemHistoryOrError = await contactContext.application.listRevisions.execute({ itemUuid: note.uuid })
    expect(contactItemHistoryOrError.isFailed()).to.equal(false)
    let contactItemHistory = contactItemHistoryOrError.getValue()
    if (contactItemHistory.length < 2) {
      await Factory.sleep(Factory.ServerRevisionCreationDelay, 'Not enough revisions found on the server. This is likely a delay issue. Retrying...')

      const contactItemHistoryOrError = await contactContext.application.listRevisions.execute({ itemUuid: note.uuid })
      expect(contactItemHistoryOrError.isFailed()).to.equal(false)

      contactItemHistory = contactItemHistoryOrError.getValue()
    }
    expect(contactItemHistory.length >= 2).to.be.true

    const itemHistoryOrError = await context.application.listRevisions.execute({ itemUuid: note.uuid })
    expect(itemHistoryOrError.isFailed()).to.equal(false)
    let itemHistory = itemHistoryOrError.getValue()
    if (itemHistory.length < 2) {
      await Factory.sleep(Factory.ServerRevisionCreationDelay, 'Not enough revisions found on the server. This is likely a delay issue. Retrying...')

      const itemHistoryOrError = await context.application.listRevisions.execute({ itemUuid: note.uuid })
      expect(itemHistoryOrError.isFailed()).to.equal(false)

      itemHistory = itemHistoryOrError.getValue()
    }
    expect(itemHistory.length >= 2).to.be.true
  })

  it('should create revision if other vault member edits node', async () => {
    const { note, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)
    deinitContactContextFunction = deinitContactContext

    await contactContext.activatePaidSubscriptionForUser()

    await Factory.sleep(Factory.ServerRevisionFrequency)

    const contactNote = contactContext.items.findItem(note.uuid)
    await contactContext.changeNoteTitleAndSync(contactNote, 'new title 1')

    await Factory.sleep(Factory.ServerRevisionCreationDelay)

    const itemHistoryOrError = await context.application.listRevisions.execute({ itemUuid: note.uuid })
    expect(itemHistoryOrError.isFailed()).to.equal(false)
    let itemHistory = itemHistoryOrError.getValue()
    if (itemHistory.length < 2) {
      await Factory.sleep(Factory.ServerRevisionCreationDelay, 'Not enough revisions found on the server. This is likely a delay issue. Retrying...')

      const itemHistoryOrError = await context.application.listRevisions.execute({ itemUuid: note.uuid })
      expect(itemHistoryOrError.isFailed()).to.equal(false)

      itemHistory = itemHistoryOrError.getValue()
    }
    expect(itemHistory.length >= 2).to.be.true
  })

  it('should be able to decrypt revisions as third party user', async () => {
    const { note, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)
    deinitContactContextFunction = deinitContactContext

    await contactContext.activatePaidSubscriptionForUser()

    await Factory.sleep(Factory.ServerRevisionFrequency)
    await context.changeNoteTitleAndSync(note, 'new title 1')

    await Factory.sleep(Factory.ServerRevisionCreationDelay)

    const itemHistoryOrError = await contactContext.application.listRevisions.execute({ itemUuid: note.uuid })
    expect(itemHistoryOrError.isFailed()).to.equal(false)
    let itemHistory = itemHistoryOrError.getValue()
    if (itemHistory.length < 1) {
      await Factory.sleep(Factory.ServerRevisionCreationDelay, 'Not enough revisions found on the server. This is likely a delay issue. Retrying...')

      const itemHistoryOrError = await contactContext.application.listRevisions.execute({ itemUuid: note.uuid })
      expect(itemHistoryOrError.isFailed()).to.equal(false)

      itemHistory = itemHistoryOrError.getValue()
    }
    const newestRevision = itemHistory[0]

    const fetchedOrError = await contactContext.application.getRevision.execute({
      itemUuid: note.uuid,
      revisionUuid: newestRevision.uuid,
    })
    const fetched = fetchedOrError.getValue()
    expect(fetched.payload.errorDecrypting).to.not.be.ok
    expect(fetched.payload.content.title).to.equal('new title 1')
  })

  it('should not be able to access history of item removed from vault', async () => {
    const { note, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)
    deinitContactContextFunction = deinitContactContext

    await contactContext.activatePaidSubscriptionForUser()

    await Factory.sleep(Factory.ServerRevisionFrequency)

    await context.changeNoteTitleAndSync(note, 'new title 1')

    await Factory.sleep(Factory.ServerRevisionFrequency)

    await context.vaults.removeItemFromVault(note)

    await Factory.sleep(Factory.ServerRevisionCreationDelay)

    const itemHistoryOrError = await contactContext.application.listRevisions.execute({ itemUuid: note.uuid })
    expect(itemHistoryOrError.isFailed()).to.equal(false)
    let itemHistory = itemHistoryOrError.getValue()
    if (itemHistory.length != 0) {
      await Factory.sleep(Factory.ServerRevisionCreationDelay, 'Not enough revisions found on the server. This is likely a delay issue. Retrying...')

      const itemHistoryOrError = await contactContext.application.listRevisions.execute({ itemUuid: note.uuid })
      expect(itemHistoryOrError.isFailed()).to.equal(false)

      itemHistory = itemHistoryOrError.getValue()
    }
    expect(itemHistory.length).to.equal(0)
  })

  it('should not be able to access history of item after user is removed from vault', async () => {
    const { note, sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)
    deinitContactContextFunction = deinitContactContext

    await contactContext.activatePaidSubscriptionForUser()

    await Factory.sleep(Factory.ServerRevisionFrequency)

    await context.changeNoteTitleAndSync(note, 'new title 1')

    await Factory.sleep(Factory.ServerRevisionCreationDelay)

    const itemHistoryBeforeOrError = await contactContext.application.listRevisions.execute({ itemUuid: note.uuid })
    expect(itemHistoryBeforeOrError.isFailed()).to.equal(false)
    let itemHistoryBefore = itemHistoryBeforeOrError.getValue()
    if (itemHistoryBefore.length < 1) {
      await Factory.sleep(Factory.ServerRevisionCreationDelay, 'Not enough revisions found on the server. This is likely a delay issue. Retrying...')

      const itemHistoryOrError = await contactContext.application.listRevisions.execute({ itemUuid: note.uuid })
      expect(itemHistoryOrError.isFailed()).to.equal(false)

      itemHistoryBefore = itemHistoryOrError.getValue()
    }
    expect(itemHistoryBefore.length >= 1).to.be.true

    await context.vaultUsers.removeUserFromSharedVault(sharedVault, contactContext.userUuid)
    await Factory.sleep(Factory.ServerRevisionCreationDelay)

    const itemHistoryAfterOrError = await contactContext.application.listRevisions.execute({ itemUuid: note.uuid })
    let itemHistoryAfter = itemHistoryAfterOrError.getValue()
    if (itemHistoryAfter.length != 0) {
      await Factory.sleep(Factory.ServerRevisionCreationDelay, 'Not enough revisions found on the server. This is likely a delay issue. Retrying...')

      const itemHistoryOrError = await contactContext.application.listRevisions.execute({ itemUuid: note.uuid })
      expect(itemHistoryOrError.isFailed()).to.equal(false)

      itemHistoryAfter = itemHistoryOrError.getValue()
    }
    expect(itemHistoryAfter.length).to.equal(0)
  })
})

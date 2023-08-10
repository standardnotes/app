import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe.skip('shared vault revisions', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let context

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createVaultsContextWithRealCrypto()

    await context.launch()
    await context.register()
  })

  afterEach(async function () {
    await context.deinit()
    localStorage.clear()
    sinon.restore()
    context = undefined
  })

  it('should be able to access shared item revisions as third party user', async () => {
    const { note, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    await Factory.sleep(Factory.ServerRevisionFrequency)

    await context.changeNoteTitleAndSync(note, 'new title 1')
    await Factory.sleep(Factory.ServerRevisionFrequency)

    await context.changeNoteTitleAndSync(note, 'new title 2')

    await Factory.sleep(Factory.ServerRevisionCreationDelay)

    const itemHistoryOrError = await contactContext.application.listRevisions.execute({ itemUuid: note.uuid })
    const itemHistory = itemHistoryOrError.getValue()
    expect(itemHistory.length).to.equal(3)

    await deinitContactContext()
  })

  it('should create revision if other vault member edits node', async () => {
    const { note, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    await Factory.sleep(Factory.ServerRevisionFrequency)

    const contactNote = contactContext.items.findItem(note.uuid)
    await contactContext.changeNoteTitleAndSync(contactNote, 'new title 1')

    await Factory.sleep(Factory.ServerRevisionCreationDelay)

    const itemHistoryOrError = await context.application.listRevisions.execute({ itemUuid: note.uuid })
    const itemHistory = itemHistoryOrError.getValue()
    expect(itemHistory.length).to.equal(2)

    await deinitContactContext()
  })

  it('should be able to decrypt revisions as third party user', async () => {
    const { note, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    await Factory.sleep(Factory.ServerRevisionFrequency)
    await context.changeNoteTitleAndSync(note, 'new title 1')

    await Factory.sleep(Factory.ServerRevisionCreationDelay)

    const itemHistoryOrError = await contactContext.application.listRevisions.execute({ itemUuid: note.uuid })
    const itemHistory = itemHistoryOrError.getValue()
    const newestRevision = itemHistory[0]

    const fetchedOrError = await contactContext.application.getRevision.execute({
      itemUuid: note.uuid,
      revisionUuid: newestRevision.uuid,
    })
    const fetched = fetchedOrError.getValue()
    expect(fetched.payload.errorDecrypting).to.not.be.ok
    expect(fetched.payload.content.title).to.equal('new title 1')

    await deinitContactContext()
  })

  it('should not be able to access history of item removed from vault', async () => {
    const { note, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    await Factory.sleep(Factory.ServerRevisionFrequency)
    await context.changeNoteTitleAndSync(note, 'new title 1')

    await Factory.sleep(Factory.ServerRevisionCreationDelay)

    await context.vaults.removeItemFromVault(note)

    const itemHistoryOrError = await contactContext.application.listRevisions.execute({ itemUuid: note.uuid })
    expect(itemHistoryOrError.isFailed()).to.be.true

    await deinitContactContext()
  })

  it('should not be able to access history of item after user is removed from vault', async () => {
    const { note, sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    await Factory.sleep(Factory.ServerRevisionFrequency)
    await context.changeNoteTitleAndSync(note, 'new title 1')

    await Factory.sleep(Factory.ServerRevisionCreationDelay)

    await context.vaultUsers.removeUserFromSharedVault(sharedVault, contactContext.userUuid)

    const itemHistoryOrError = await contactContext.application.listRevisions.execute({ itemUuid: note.uuid })
    expect(itemHistoryOrError.isFailed()).to.be.true

    await deinitContactContext()
  })
})

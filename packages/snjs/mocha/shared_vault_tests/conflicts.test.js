import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('shared vaults conflicts', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let context

  afterEach(async function () {
    await context.deinit()
    localStorage.clear()
  })

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createAppContextWithRealCrypto()

    await context.launch()
    await context.register()
  })

  it('after leaving shared vault, attempting to sync previously vault item should result in SharedVaultNotMemberError', async () => {
    const { sharedVault, note, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    await context.sharedVaults.removeUserFromSharedVault(sharedVault, contactContext.userUuid)
    const promise = contactContext.resolveWithConflicts()
    await contactContext.changeNoteTitleAndSync(note, 'new title')
    const conflicts = await promise

    expect(conflicts.length).to.equal(1)
    expect(conflicts[0].type).to.equal(ConflictType.SharedVaultNotMemberError)
    expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)

    await deinitContactContext()
  })

  it('conflicts created should be associated with the vault', async () => {
    const { note, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    await context.changeNoteTitle(note, 'new title first client')
    await contactContext.changeNoteTitle(note, 'new title second client')

    const doneAddingConflictToSharedVault = contactContext.resolveWhenSavedSyncPayloadsIncludesItemThatIsDuplicatedOf(
      note.uuid,
    )

    await context.sync({ desc: 'First client sync' })
    await contactContext.sync({
      desc: 'Second client sync with conflicts to be created',
    })
    await doneAddingConflictToSharedVault
    await context.sync({ desc: 'First client sync with conflicts to be pulled in' })

    expect(context.items.invalidItems.length).to.equal(0)
    expect(contactContext.items.invalidItems.length).to.equal(0)

    const collaboratorNotes = contactContext.items.getDisplayableNotes()
    expect(collaboratorNotes.length).to.equal(2)
    expect(collaboratorNotes.find((note) => !!note.duplicate_of)).to.not.be.undefined

    const originatorNotes = context.items.getDisplayableNotes()
    expect(originatorNotes.length).to.equal(2)
    expect(originatorNotes.find((note) => !!note.duplicate_of)).to.not.be.undefined

    await deinitContactContext()
  })

  it('attempting to modify note as read user should result in SharedVaultInsufficientPermissionsError', async () => {
    const { note, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context, SharedVaultPermission.Read)

    const promise = contactContext.resolveWithConflicts()
    await contactContext.changeNoteTitleAndSync(note, 'new title')
    const conflicts = await promise

    expect(conflicts.length).to.equal(1)
    expect(conflicts[0].type).to.equal(ConflictType.SharedVaultInsufficientPermissionsError)
    expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)

    await deinitContactContext()
  })

  it('should handle SharedVaultNotMemberError by duplicating item to user non-vault', async () => {
    const { sharedVault, note, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    await context.sharedVaults.removeUserFromSharedVault(sharedVault, contactContext.userUuid)
    await contactContext.changeNoteTitleAndSync(note, 'new title')
    const notes = contactContext.notes

    expect(notes.length).to.equal(1)
    expect(notes[0].title).to.equal('new title')
    expect(notes[0].key_system_identifier).to.not.be.ok
    expect(notes[0].duplicate_of).to.equal(note.uuid)

    await deinitContactContext()
  })

  it('attempting to save note to non-existent vault should result in SharedVaultNotMemberError conflict', async () => {
    const note = await context.createSyncedNote('foo', 'bar')

    const promise = context.resolveWithConflicts()
    const objectToSpy = context.application.sync

    sinon.stub(objectToSpy, 'payloadsByPreparingForServer').callsFake(async (params) => {
      objectToSpy.payloadsByPreparingForServer.restore()

      const payloads = await objectToSpy.payloadsByPreparingForServer(params)
      for (const payload of payloads) {
        payload.key_system_identifier = 'non-existent-vault-uuid-123'
      }

      return payloads
    })

    await context.changeNoteTitleAndSync(note, 'new-title')
    const conflicts = await promise

    expect(conflicts.length).to.equal(1)
    expect(conflicts[0].type).to.equal(ConflictType.SharedVaultNotMemberError)
    expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)
  })

  it('attempting to save item using an old vault items key should result in SharedVaultInvalidItemsKey conflict', async () => {
    const sharedVault = await Collaboration.createSharedVault(context)

    const note = await context.createSyncedNote('foo', 'bar')
    await context.addItemToVault(context, keySystemIdentifier, note)

    const oldKeySystemItemsKey = context.items.getKeySystemItemsKeys(keySystemIdentifier)[0]

    await context.vaults.rotateKeySystemRootKey(keySystemIdentifier)

    await context.sharedVaults.sharedVaultCache.updateSharedVaults([
      {
        ...sharedVault,
        specified_items_key_uuid: oldKeySystemItemsKey.uuid,
      },
    ])

    const promise = context.resolveWithConflicts()
    await context.changeNoteTitleAndSync(note, 'new title')
    const conflicts = await promise

    expect(conflicts.length).to.equal(1)
    expect(conflicts[0].type).to.equal(ConflictType.SharedVaultInvalidItemsKeyError)
    expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)
  })

  it('should create a non-vaulted copy if attempting to move item from vault to user and item belongs to someone else', async () => {
    const { note, sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    const promise = contactContext.resolveWithConflicts()
    await contactContext.vaults.removeItemFromVault(note)
    const conflicts = await promise

    expect(conflicts.length).to.equal(1)
    expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)

    const duplicateNote = contactContext.findDuplicateNote(note.uuid)
    expect(duplicateNote).to.not.be.undefined
    expect(duplicateNote.key_system_identifier).to.not.be.ok

    const existingNote = contactContext.items.findItem(note.uuid)
    expect(existingNote.key_system_identifier).to.equal(keySystemIdentifier)

    await deinitContactContext()
  })

  it('should created a non-vaulted copy if admin attempts to move item from vault to user if the item belongs to someone else', async () => {
    const { keySystemIdentifier, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const note = await contactContext.createSyncedNote('foo', 'bar')
    await contactContext.addItemToVault(context, keySystemIdentifier, note)
    await context.sync()

    const promise = context.resolveWithConflicts()
    await context.vaults.removeItemFromVault(note)
    const conflicts = await promise

    expect(conflicts.length).to.equal(1)
    expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)

    const duplicateNote = context.findDuplicateNote(note.uuid)
    expect(duplicateNote).to.not.be.undefined
    expect(duplicateNote.key_system_identifier).to.not.be.ok

    const existingNote = context.items.findItem(note.uuid)
    expect(existingNote.key_system_identifier).to.equal(keySystemIdentifier)

    await deinitContactContext()
  })
})

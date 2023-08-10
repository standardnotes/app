import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('shared vault conflicts', function () {
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

  it('after being removed from shared vault, attempting to sync previous vault item should result in SharedVaultNotMemberError. The item should be duplicated then removed.', async () => {
    const { sharedVault, note, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    contactContext.lockSyncing()
    await context.vaultUsers.removeUserFromSharedVault(sharedVault, contactContext.userUuid)
    const promise = contactContext.resolveWithConflicts()
    contactContext.unlockSyncing()
    await contactContext.changeNoteTitleAndSync(note, 'new title')
    const conflicts = await promise
    await contactContext.sync()

    expect(conflicts.length).to.equal(1)
    expect(conflicts[0].type).to.equal(ConflictType.SharedVaultNotMemberError)
    expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.TYPES.Note)

    const collaboratorNotes = contactContext.items.getDisplayableNotes()
    expect(collaboratorNotes.length).to.equal(1)
    expect(collaboratorNotes[0].duplicate_of).to.not.be.undefined
    expect(collaboratorNotes[0].title).to.equal('new title')

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
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(
        context,
        SharedVaultUserPermission.PERMISSIONS.Read,
      )

    const promise = contactContext.resolveWithConflicts()
    await contactContext.changeNoteTitleAndSync(note, 'new title')
    const conflicts = await promise

    expect(conflicts.length).to.equal(1)
    expect(conflicts[0].type).to.equal(ConflictType.SharedVaultInsufficientPermissionsError)
    expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.TYPES.Note)

    await deinitContactContext()
  })

  it('should handle SharedVaultNotMemberError by duplicating item to user non-vault', async () => {
    const { sharedVault, note, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    await context.vaultUsers.removeUserFromSharedVault(sharedVault, contactContext.userUuid)
    await contactContext.changeNoteTitleAndSync(note, 'new title')
    const notes = contactContext.notes

    expect(notes.length).to.equal(1)
    expect(notes[0].title).to.equal('new title')
    expect(notes[0].key_system_identifier).to.not.be.ok
    expect(notes[0].duplicate_of).to.equal(note.uuid)

    await deinitContactContext()
  })

  it('attempting to save note to non-existent vault should result in SharedVaultNotMemberError conflict', async () => {
    context.anticipateConsoleError(
      'Error decrypting contentKey from parameters',
      'An invalid shared vault uuid is being assigned to an item',
    )
    const { note } = await Collaboration.createSharedVaultWithNote(context)

    const promise = context.resolveWithConflicts()

    const objectToSpy = context.application.sync
    sinon.stub(objectToSpy, 'payloadsByPreparingForServer').callsFake(async (params) => {
      objectToSpy.payloadsByPreparingForServer.restore()
      const payloads = await objectToSpy.payloadsByPreparingForServer(params)
      const nonExistentSharedVaultUuid = '00000000-0000-0000-0000-000000000000'
      for (const payload of payloads) {
        payload.shared_vault_uuid = nonExistentSharedVaultUuid
      }

      return payloads
    })

    await context.changeNoteTitleAndSync(note, 'new-title')
    const conflicts = await promise

    expect(conflicts.length).to.equal(1)
    expect(conflicts[0].type).to.equal(ConflictType.SharedVaultNotMemberError)
    expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.TYPES.Note)
  })

  it('should create a non-vaulted copy if attempting to move item from vault to user and item belongs to someone else', async () => {
    const { note, sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    const promise = contactContext.resolveWithConflicts()
    await contactContext.vaults.removeItemFromVault(note)
    const conflicts = await promise

    expect(conflicts.length).to.equal(1)
    expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.TYPES.Note)

    const duplicateNote = contactContext.findDuplicateNote(note.uuid)
    expect(duplicateNote).to.not.be.undefined
    expect(duplicateNote.key_system_identifier).to.not.be.ok

    const existingNote = contactContext.items.findItem(note.uuid)
    expect(existingNote.key_system_identifier).to.equal(sharedVault.systemIdentifier)

    await deinitContactContext()
  })

  it('should created a non-vaulted copy if admin attempts to move item from vault to user if the item belongs to someone else', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const note = await contactContext.createSyncedNote('foo', 'bar')
    await Collaboration.moveItemToVault(contactContext, sharedVault, note)
    await context.sync()

    const promise = context.resolveWithConflicts()
    await context.vaults.removeItemFromVault(note)
    const conflicts = await promise

    expect(conflicts.length).to.equal(1)
    expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.TYPES.Note)

    const duplicateNote = context.findDuplicateNote(note.uuid)
    expect(duplicateNote).to.not.be.undefined
    expect(duplicateNote.key_system_identifier).to.not.be.ok

    const existingNote = context.items.findItem(note.uuid)
    expect(existingNote.key_system_identifier).to.equal(sharedVault.systemIdentifier)

    await deinitContactContext()
  })
})

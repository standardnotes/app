import * as Factory from '../lib/factory.js'
import * as Files from '../lib/Files.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('shared vault permissions', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let context
  let vaults
  let sharedVaults

  afterEach(async function () {
    await context.deinit()
    localStorage.clear()
  })

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createAppContextWithRealCrypto()

    await context.launch()
    await context.register()

    vaults = context.vaults
    sharedVaults = context.sharedVaults
  })

  it('non-admin user should not be able to invite user', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    const thirdParty = await Collaboration.createContactContext()
    const thirdPartyContact = await Collaboration.createTrustedContactForUserOfContext(
      contactContext,
      thirdParty.contactContext,
    )
    const result = await contactContext.sharedVaults.inviteContactToSharedVault(
      sharedVault,
      thirdPartyContact,
      SharedVaultPermission.Write,
    )

    expect(isClientDisplayableError(result)).to.be.true

    await deinitContactContext()
  })

  it('should not be able to leave shared vault as creator', async () => {
    const sharedVault = await Collaboration.createSharedVault(context)

    const result = await sharedVaults.removeUserFromSharedVault(sharedVault, context.userUuid)

    expect(isClientDisplayableError(result)).to.be.true
  })

  it('should be able to leave shared vault as added admin', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context, SharedVaultPermission.Admin)

    const result = await contactContext.sharedVaults.leaveSharedVault(sharedVault)

    expect(isClientDisplayableError(result)).to.be.false

    await deinitContactContext()
  })

  it('should not be able to update a vault with a keyTimestamp lower than the current one', async () => {
    const sharedVault = await Collaboration.createSharedVault(context)
    const keySystemRootKey = context.items.getPrimaryKeySystemRootKey(keySystemIdentifier)

    const result = await sharedVaults.updateSharedVault({
      sharedVaultUuid: 'todo',
      specifiedItemsKeyUuid: '123',
    })

    expect(isClientDisplayableError(result)).to.be.true
  })

  it("should use the cached sharedVault's specified items key when choosing which key to encrypt vault items with", async () => {
    const sharedVault = await Collaboration.createSharedVault(context)

    const firstKeySystemItemsKey = context.items.getKeySystemItemsKeys(keySystemIdentifier)[0]

    const note = await context.createSyncedNote('foo', 'bar')
    const firstPromise = context.resolveWithUploadedPayloads()
    await context.addItemToVault(context, keySystemIdentifier, note)
    const firstUploadedPayloads = await firstPromise

    expect(firstUploadedPayloads[0].items_key_id).to.equal(firstKeySystemItemsKey.uuid)
    expect(firstUploadedPayloads[0].items_key_id).to.equal(vault.specified_items_key_uuid)

    await context.vaults.rotateKeySystemRootKey(keySystemIdentifier)
    const secondKeySystemItemsKey = context.items.getKeySystemItemsKeys(keySystemIdentifier)[0]

    const secondPromise = context.resolveWithUploadedPayloads()
    await context.changeNoteTitleAndSync(note, 'new title')
    const secondUploadedPayloads = await secondPromise

    expect(secondUploadedPayloads[0].items_key_id).to.equal(secondKeySystemItemsKey.uuid)

    await context.sharedVaults.sharedVaultCache.updateSharedVaults([
      {
        ...sharedVault,
        specified_items_key_uuid: firstKeySystemItemsKey.uuid,
      },
    ])

    const thirdPromise = context.resolveWithUploadedPayloads()
    await context.changeNoteTitleAndSync(note, 'third new title')
    const thirdUploadedPayloads = await thirdPromise

    expect(thirdUploadedPayloads[0].items_key_id).to.equal(firstKeySystemItemsKey.uuid)
  })

  it('non-admin user should not be able to create or update vault items keys with the server', async () => {
    const { keySystemIdentifier, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const keySystemItemsKey = contactContext.items.getKeySystemItemsKeys(keySystemIdentifier)[0]

    await contactContext.items.changeItem(keySystemItemsKey, () => {})
    const promise = contactContext.resolveWithConflicts()
    await contactContext.sync()

    const conflicts = await promise

    expect(conflicts.length).to.equal(1)
    expect(conflicts[0].unsaved_item).to.equal(ContentType.KeySystemItemsKey)

    await deinitContactContext()
  })

  it("vault user should not be able to change an item using an items key that does not match the vault's specified items key", async () => {
    const { keySystemIdentifier, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const note = await context.createSyncedNote('foo', 'bar')
    await Collaboration.addItemToVault(context, sharedVault, note)
    await contactContext.sync()

    const newItemsKeyUuid = UuidGenerator.GenerateUuid()
    const newItemsKey = contactContext.encryption.createKeySystemItemsKey(newItemsKeyUuid, keySystemIdentifier)
    await contactContext.items.insertItem(newItemsKey)

    const contactVault = contactContext.vaults.vaultStorage.getVault(keySystemIdentifier)
    contactContext.vaults.vaultStorage.setVault(keySystemIdentifier, {
      ...contactsharedVault,
      specifiedItemsKeyUuid: newItemsKeyUuid,
    })

    await contactContext.items.changeItem({ uuid: note.uuid }, (mutator) => {
      mutator.title = 'new title'
    })

    const promise = contactContext.resolveWithConflicts()
    await contactContext.sync()
    const conflicts = await promise

    expect(conflicts.length).to.equal(2)
    expect(conflicts.find((conflict) => conflict.unsaved_item.content_type === ContentType.Note)).to.not.be.undefined
    expect(conflicts.find((conflict) => conflict.unsaved_item.content_type === ContentType.KeySystemItemsKey)).to.not.be
      .undefined

    await deinitContactContext()
  })

  it('read user should not be able to make changes to items', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context, SharedVaultPermission.Read)
    const note = await context.createSyncedNote('foo', 'bar')
    await Collaboration.addItemToVault(context, sharedVault, note)
    await contactContext.sync()

    await contactContext.items.changeItem({ uuid: note.uuid }, (mutator) => {
      mutator.title = 'new title'
    })

    const promise = contactContext.resolveWithConflicts()
    await contactContext.sync()
    const conflicts = await promise

    expect(conflicts.length).to.equal(1)
    expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)

    await deinitContactContext()
  })

  it('should be able to move item from vault to user as a write user if the item belongs to me', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const note = await contactContext.createSyncedNote('foo', 'bar')
    await contactContext.addItemToVault(context, sharedVault, note)
    await contactContext.sync()

    const promise = contactContext.resolveWithConflicts()
    await contactContext.vaults.removeItemFromVault(note)
    const conflicts = await promise

    expect(conflicts.length).to.equal(0)

    const duplicateNote = contactContext.findDuplicateNote(note.uuid)
    expect(duplicateNote).to.be.undefined

    const existingNote = contactContext.items.findItem(note.uuid)
    expect(existingNote.key_system_identifier).to.not.be.ok

    await deinitContactContext()
  })
})

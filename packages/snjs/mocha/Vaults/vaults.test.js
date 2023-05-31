import * as Factory from '../lib/factory.js'
import * as Files from '../lib/Files.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe.only('vaults', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let application
  let context
  let vaultService

  afterEach(async function () {
    await Factory.safeDeinit(application)
    localStorage.clear()
  })

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createAppContextWithRealCrypto()

    await context.launch()
    await context.register()

    application = context.application
    vaultService = application.vaultService
  })

  it('should create a vault', async () => {
    const vault = await vaultService.createVault()
    expect(vault).to.not.be.undefined

    const vaultItemsKeys = application.items.getVaultItemsKeysForVault(vault.uuid)
    expect(vaultItemsKeys.length).to.equal(1)

    const vaultItemsKey = vaultItemsKeys[0]
    expect(vaultItemsKey instanceof VaultItemsKey).to.be.true
    expect(vaultItemsKey.vault_uuid).to.equal(vault.uuid)
  })

  it('should add item to vault', async () => {
    const note = await context.createSyncedNote('foo', 'bar')
    const vault = await vaultService.createVault()

    await vaultService.addItemToVault(vault, note)

    const updatedNote = application.items.findItem(note.uuid)
    expect(updatedNote.vault_uuid).to.equal(vault.uuid)
  })

  describe('client timing', () => {
    it('should load data in the correct order at startup to allow vault items and their keys to decrypt', async () => {
      const appIdentifier = context.identifier
      const vault = await vaultService.createVault()
      const note = await context.createSyncedNote('foo', 'bar')
      await vaultService.addItemToVault(vault, note)
      await context.deinit()

      const recreatedContext = await Factory.createAppContextWithRealCrypto(appIdentifier)
      await recreatedContext.launch()

      const updatedNote = recreatedContext.application.items.findItem(note.uuid)
      expect(updatedNote.title).to.equal('foo')
      expect(updatedNote.text).to.equal('bar')
    })
  })

  describe('vault key rotation', () => {
    it('rotating a vault key should create a new vault items key', async () => {
      const vault = await vaultService.createVault()

      const vaultItemsKey = context.items.getVaultItemsKeysForVault(vault.uuid)[0]

      await vaultService.rotateVaultKey(vault.uuid)

      const updatedVaultItemsKey = context.items.getVaultItemsKeysForVault(vault.uuid)[0]

      expect(updatedVaultItemsKey).to.not.be.undefined
      expect(updatedVaultItemsKey.uuid).to.not.equal(vaultItemsKey.uuid)
    })

    it('should keep vault key with greater keyTimestamp if conflict', async () => {
      const vault = await vaultService.createVault()
      const vaultKey = vaultService.getVaultKey(vault.uuid)

      const otherClient = await Factory.createAppContextWithRealCrypto()
      await otherClient.launch()
      otherClient.email = context.email
      otherClient.password = context.password
      await otherClient.signIn(context.email, context.password)

      context.lockSyncing()
      otherClient.lockSyncing()

      const olderTimestamp = vaultKey.keyTimestamp + 1
      const newerTimestamp = vaultKey.keyTimestamp + 2

      await context.application.items.changeItem(vaultKey, (mutator) => {
        mutator.content = {
          vaultKey: 'new-vault-key',
          keyTimestamp: olderTimestamp,
        }
      })

      const otherVaultKey = otherClient.vaultService.getVaultKey(vault.uuid)
      await otherClient.application.items.changeItem(otherVaultKey, (mutator) => {
        mutator.content = {
          vaultKey: 'new-vault-key',
          keyTimestamp: newerTimestamp,
        }
      })

      context.unlockSyncing()
      otherClient.unlockSyncing()

      await otherClient.sync()
      await context.sync()

      expect(context.items.getItems(ContentType.VaultKey).length).to.equal(1)
      expect(otherClient.items.getItems(ContentType.VaultKey).length).to.equal(1)

      const vaultKeyAfterSync = context.vaultService.getVaultKey(vault.uuid)
      const otherVaultKeyAfterSync = otherClient.vaultService.getVaultKey(vault.uuid)

      expect(vaultKeyAfterSync.keyTimestamp).to.equal(otherVaultKeyAfterSync.keyTimestamp)
      expect(vaultKeyAfterSync.vaultKey).to.equal(otherVaultKeyAfterSync.vaultKey)
      expect(vaultKeyAfterSync.keyTimestamp).to.equal(newerTimestamp)
      expect(otherVaultKeyAfterSync.keyTimestamp).to.equal(newerTimestamp)

      await otherClient.deinit()
    })
  })

  describe('permissions', async () => {
    it('should not be able to update a vault with a keyTimestamp lower than the current one', async () => {
      const vault = await vaultService.createVault()
      const vaultKey = vaultService.getVaultKey(vault.uuid)

      const result = await vaultService.updateServerVaultWithNewKeyInformation(vault.uuid, {
        vaultKeyTimestamp: vaultKey.keyTimestamp - 1,
        specifiedItemsKeyUuid: '123',
      })

      expect(isClientDisplayableError(result)).to.be.true
    })

    it.only('attempting to save note to non-existent vault should result in VaultNotMemberError conflict', async () => {
      const note = await context.createSyncedNote('foo', 'bar')

      const promise = context.resolveWithConflicts()
      const objectToSpy = application.sync

      sinon.stub(objectToSpy, 'payloadsByPreparingForServer').callsFake(async (params) => {
        objectToSpy.payloadsByPreparingForServer.restore()

        const payloads = await objectToSpy.payloadsByPreparingForServer(params)
        for (const payload of payloads) {
          payload.vault_uuid = 'non-existent-vault-uuid-123'
        }

        return payloads
      })

      await context.changeNoteTitleAndSync(note, 'new-title')
      const conflicts = await promise

      expect(conflicts.length).to.equal(1)
      expect(conflicts[0].type).to.equal(ConflictType.VaultNotMemberError)
      expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)
    })

    it('attempting to add deleted item to vault should result in VaultInvalidState conflict', async () => {
      const vault = await vaultService.createVault()

      const note = await context.createSyncedNote('foo', 'bar')
      await context.items.setItemToBeDeleted(note)
      await context.sync()

      const promise = context.resolveWithConflicts()
      await context.vaultService.addItemToVault(vault, note)
      const conflicts = await promise

      expect(conflicts.length).to.equal(1)
      expect(conflicts[0].type).to.equal(ConflictType.VaultInvalidStateError)
      expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)
    })

    it('attempting to save item using an old vault items key should result in VaultInvalidItemsKey conflict', async () => {
      const vault = await vaultService.createVault()

      const note = await context.createSyncedNote('foo', 'bar')
      await context.vaultService.addItemToVault(vault, note)

      const oldVaultItemsKey = context.items.getVaultItemsKeysForVault(vault.uuid)[0]

      await context.vaultService.rotateVaultKey(vault.uuid)

      await context.vaultService.handleReceivedVaults([
        {
          ...vault,
          specified_items_key_uuid: oldVaultItemsKey.uuid,
        },
      ])

      const promise = context.resolveWithConflicts()
      await context.changeNoteTitleAndSync(note, 'new title')
      const conflicts = await promise

      expect(conflicts.length).to.equal(1)
      expect(conflicts[0].type).to.equal(ConflictType.VaultInvalidItemsKeyError)
      expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)
    })

    it("should use the cached group's specified items key when choosing which key to encrypt vault items with", async () => {
      const vault = await vaultService.createVault()

      const firstVaultItemsKey = context.items.getVaultItemsKeysForVault(vault.uuid)[0]

      const note = await context.createSyncedNote('foo', 'bar')
      const firstPromise = context.resolveWithUploadedPayloads()
      await context.vaultService.addItemToVault(vault, note)
      const firstUploadedPayloads = await firstPromise

      expect(firstUploadedPayloads[0].items_key_id).to.equal(firstVaultItemsKey.uuid)
      expect(firstUploadedPayloads[0].items_key_id).to.equal(vault.specified_items_key_uuid)

      await context.vaultService.rotateVaultKey(vault.uuid)
      const secondVaultItemsKey = context.items.getVaultItemsKeysForVault(vault.uuid)[0]

      const secondPromise = context.resolveWithUploadedPayloads()
      await context.changeNoteTitleAndSync(note, 'new title')
      const secondUploadedPayloads = await secondPromise

      expect(secondUploadedPayloads[0].items_key_id).to.equal(secondVaultItemsKey.uuid)

      await context.vaultService.handleReceivedVaults([
        {
          ...vault,
          specified_items_key_uuid: firstVaultItemsKey.uuid,
        },
      ])

      const thirdPromise = context.resolveWithUploadedPayloads()
      await context.changeNoteTitleAndSync(note, 'third new title')
      const thirdUploadedPayloads = await thirdPromise

      expect(thirdUploadedPayloads[0].items_key_id).to.equal(firstVaultItemsKey.uuid)
    })
  })

  describe('files', () => {
    beforeEach(async () => {
      await context.publicMockSubscriptionPurchaseEvent()
    })

    it('should be able to upload and download file to vault as owner', async () => {
      const vault = await vaultService.createVault()
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())
      const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, vault.uuid)

      const file = context.items.findItem(uploadedFile.uuid)
      expect(file).to.not.be.undefined
      expect(file.remoteIdentifier).to.equal(file.remoteIdentifier)
      expect(file.vault_uuid).to.equal(vault.uuid)

      const downloadedBytes = await Files.downloadFile(context.files, file)
      expect(downloadedBytes).to.eql(buffer)
    })

    it('should be able to move a user file to a vault', async () => {
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())

      const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000)

      const vault = await vaultService.createVault()
      const addedFile = await vaultService.addItemToVault(vault, uploadedFile)

      const downloadedBytes = await Files.downloadFile(context.files, addedFile)
      expect(downloadedBytes).to.eql(buffer)
    })

    it('should be able to move a file out of its vault', async () => {
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())

      const vault = await vaultService.createVault()
      const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, vault.uuid)

      const removedFile = await vaultService.moveItemFromVaultToUser(uploadedFile)
      expect(removedFile.vault_uuid).to.not.be.ok

      const downloadedBytes = await Files.downloadFile(context.files, removedFile)
      expect(downloadedBytes).to.eql(buffer)
    })
  })
})

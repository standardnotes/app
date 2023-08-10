import { BaseItemCounts } from '../lib/BaseItemCounts.js'
import * as Factory from '../lib/factory.js'
import { createRelatedNoteTagPairPayload } from '../lib/Items.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('importing', function () {
  this.timeout(Factory.TenSecondTimeout)

  let expectedItemCount
  let application
  let email
  let password
  let context

  afterEach(async function () {
    if (application) {
      await Factory.safeDeinit(application)
    }
    localStorage.clear()
    application = undefined
    context = undefined
  })

  describe('fake crypto', function () {
    beforeEach(async function () {
      localStorage.clear()
      expectedItemCount = BaseItemCounts.DefaultItems

      context = await Factory.createAppContext()

      await context.launch()
      application = context.application

      email = UuidGenerator.GenerateUuid()
      password = UuidGenerator.GenerateUuid()
      Factory.handlePasswordChallenges(application, password)
    })

    it('should not import backups made from unsupported versions', async function () {
      const result = await application.importData({
        version: '-1',
        items: [],
      })
      expect(result.isFailed()).to.be.true
    })

    it('should not import backups made from 004 into 003 account', async function () {
      await Factory.registerOldUser({
        application,
        email,
        password,
        version: ProtocolVersion.V003,
      })
      const result = await application.importData({
        version: ProtocolVersion.V004,
        items: [],
      })
      expect(result.isFailed()).to.be.true
    })

    it('importing existing data should keep relationships valid', async function () {
      const pair = createRelatedNoteTagPairPayload()
      const notePayload = pair[0]
      const tagPayload = pair[1]

      await application.mutator.emitItemsFromPayloads([notePayload, tagPayload], PayloadEmitSource.LocalChanged)
      expectedItemCount += 2
      const note = application.items.getItems([ContentType.TYPES.Note])[0]
      const tag = application.items.getItems([ContentType.TYPES.Tag])[0]

      expect(tag.content.references.length).to.equal(1)
      expect(tag.noteCount).to.equal(1)

      expect(note.content.references.length).to.equal(0)
      expect(application.items.itemsReferencingItem(note).length).to.equal(1)

      await application.importData(
        {
          items: [notePayload, tagPayload],
        },
        true,
      )

      expect(application.items.items.length).to.equal(expectedItemCount)

      expect(tag.content.references.length).to.equal(1)
      expect(tag.noteCount).to.equal(1)

      expect(note.content.references.length).to.equal(0)
      expect(application.items.itemsReferencingItem(note).length).to.equal(1)
    })

    it('importing same note many times should create only one duplicate', async function () {
      /**
       * Used strategy here will be KEEP_LEFT_DUPLICATE_RIGHT
       * which means that new right items will be created with different
       */

      const notePayload = Factory.createNotePayload()
      await application.mutator.emitItemFromPayload(notePayload, PayloadEmitSource.LocalChanged)
      expectedItemCount++
      const mutatedNote = new DecryptedPayload({
        ...notePayload,
        content: {
          ...notePayload.content,
          title: `${Math.random()}`,
        },
      })
      await application.importData(
        {
          items: [mutatedNote, mutatedNote, mutatedNote],
        },
        true,
      )
      expectedItemCount++
      expect(application.items.getDisplayableNotes().length).to.equal(2)
      const imported = application.items.getDisplayableNotes().find((n) => n.uuid !== notePayload.uuid)
      expect(imported.content.title).to.equal(mutatedNote.content.title)
    })

    it('importing a tag with lesser references should not create duplicate', async function () {
      const pair = createRelatedNoteTagPairPayload()
      const tagPayload = pair[1]
      await application.mutator.emitItemsFromPayloads(pair, PayloadEmitSource.LocalChanged)
      const mutatedTag = new DecryptedPayload({
        ...tagPayload,
        content: {
          ...tagPayload.content,
          references: [],
        },
      })
      await application.importData(
        {
          items: [mutatedTag],
        },
        true,
      )
      expect(application.items.getDisplayableTags().length).to.equal(1)
      expect(application.items.findItem(tagPayload.uuid).content.references.length).to.equal(1)
    })

    it('importing data with differing content should create duplicates', async function () {
      const pair = createRelatedNoteTagPairPayload()
      const notePayload = pair[0]
      const tagPayload = pair[1]
      await application.mutator.emitItemsFromPayloads(pair, PayloadEmitSource.LocalChanged)
      expectedItemCount += 2
      const note = application.items.getDisplayableNotes()[0]
      const tag = application.items.getDisplayableTags()[0]
      const mutatedNote = new DecryptedPayload({
        ...notePayload,
        content: {
          ...notePayload.content,
          title: `${Math.random()}`,
        },
      })
      const mutatedTag = new DecryptedPayload({
        ...tagPayload,
        content: {
          ...tagPayload.content,
          title: `${Math.random()}`,
        },
      })
      await application.importData(
        {
          items: [mutatedNote, mutatedTag],
        },
        true,
      )
      expectedItemCount += 2
      expect(application.items.items.length).to.equal(expectedItemCount)

      const newNote = application.items.getDisplayableNotes().find((n) => n.uuid !== notePayload.uuid)
      const newTag = application.items.getDisplayableTags().find((t) => t.uuid !== tagPayload.uuid)

      expect(newNote.uuid).to.not.equal(note.uuid)
      expect(newTag.uuid).to.not.equal(tag.uuid)

      const refreshedTag = application.items.findItem(tag.uuid)
      expect(refreshedTag.content.references.length).to.equal(2)
      expect(refreshedTag.noteCount).to.equal(2)

      const refreshedNote = application.items.findItem(note.uuid)
      expect(refreshedNote.content.references.length).to.equal(0)
      expect(application.items.itemsReferencingItem(refreshedNote).length).to.equal(2)

      expect(newTag.content.references.length).to.equal(1)
      expect(newTag.noteCount).to.equal(1)

      expect(newNote.content.references.length).to.equal(0)
      expect(application.items.itemsReferencingItem(newNote).length).to.equal(1)
    })

    it('when importing items, imported values should not be used to determine if changed', async function () {
      /**
       * If you have a note and a tag, and the tag has 1 reference to the note,
       * and you import the same two items, except modify the note value so that
       * a duplicate is created, we expect only the note to be duplicated, and the
       * tag not to. However, if only the note changes, and you duplicate the note,
       * which causes the tag's references content to change, then when the incoming
       * tag is being processed, it will also think it has changed, since our local
       * value now doesn't match what's coming in. The solution is to get all values
       * ahead of time before any changes are made.
       */

      const note = await Factory.createMappedNote(application)
      const tag = await Factory.createMappedTag(application)
      expectedItemCount += 2

      await application.mutator.changeItem(tag, (mutator) => {
        mutator.e2ePendingRefactor_addItemAsRelationship(note)
      })

      const externalNote = Object.assign(
        {},
        {
          uuid: note.uuid,
          content: note.getContentCopy(),
          content_type: note.content_type,
        },
      )
      externalNote.content.text = `${Math.random()}`

      const externalTag = Object.assign(
        {},
        {
          uuid: tag.uuid,
          content: tag.getContentCopy(),
          content_type: tag.content_type,
        },
      )

      await application.importData(
        {
          items: [externalNote, externalTag],
        },
        true,
      )
      expectedItemCount += 1

      /** We expect now that the total item count is 3, not 4. */
      expect(application.items.items.length).to.equal(expectedItemCount)

      const refreshedTag = application.items.findItem(tag.uuid)
      /** References from both items have merged. */
      expect(refreshedTag.content.references.length).to.equal(2)
    })

    it('should import decrypted data and keep items that were previously deleted', async function () {
      await Factory.registerUserToApplication({
        application: application,
        email: email,
        password: password,
      })

      Factory.handlePasswordChallenges(application, password)

      const [note, tag] = await Promise.all([
        Factory.createMappedNote(application),
        Factory.createMappedTag(application),
      ])

      await application.sync.sync({ awaitAll: true })

      await application.mutator.deleteItem(note)
      await application.sync.sync()
      expect(application.items.findItem(note.uuid)).to.not.exist

      await application.mutator.deleteItem(tag)
      await application.sync.sync()
      expect(application.items.findItem(tag.uuid)).to.not.exist

      await application.importData(
        {
          items: [note, tag],
        },
        true,
      )

      expect(application.items.getDisplayableNotes().length).to.equal(1)
      expect(application.items.findItem(note.uuid).deleted).to.not.be.ok

      expect(application.items.getDisplayableTags().length).to.equal(1)
      expect(application.items.findItem(tag.uuid).deleted).to.not.be.ok
    })

    it('should duplicate notes by alternating UUIDs when dealing with conflicts during importing', async function () {
      await Factory.registerUserToApplication({
        application: application,
        email: email,
        password: password,
      })
      const note = await Factory.createSyncedNote(application)

      /** Sign into another account and import the same item. It should get a different UUID. */
      application = await Factory.signOutApplicationAndReturnNew(application)
      email = UuidGenerator.GenerateUuid()
      Factory.handlePasswordChallenges(application, password)

      await Factory.registerUserToApplication({
        application: application,
        email: email,
        password: password,
      })

      await application.importData(
        {
          items: [note.payload],
        },
        true,
      )

      expect(application.items.getDisplayableNotes().length).to.equal(1)
      expect(application.items.getDisplayableNotes()[0].uuid).to.not.equal(note.uuid)
    })

    it('should maintain consistency between storage and PayloadManager after an import with conflicts', async function () {
      await Factory.registerUserToApplication({
        application: application,
        email: email,
        password: password,
      })
      const note = await Factory.createSyncedNote(application)

      /** Sign into another account and import the same items. They should get a different UUID. */
      application = await Factory.signOutApplicationAndReturnNew(application)
      email = UuidGenerator.GenerateUuid()
      Factory.handlePasswordChallenges(application, password)
      await Factory.registerUserToApplication({
        application: application,
        email: email,
        password: password,
      })

      await application.importData(
        {
          items: [note],
        },
        true,
      )

      const storedPayloads = await application.storage.getAllRawPayloads()
      expect(application.items.items.length).to.equal(storedPayloads.length)
      const notes = storedPayloads.filter((p) => p.content_type === ContentType.TYPES.Note)
      const itemsKeys = storedPayloads.filter((p) => p.content_type === ContentType.TYPES.ItemsKey)
      expect(notes.length).to.equal(1)
      expect(itemsKeys.length).to.equal(1)
    })

    it('should import encrypted data and keep items that were previously deleted', async function () {
      await Factory.registerUserToApplication({
        application: application,
        email: email,
        password: password,
      })

      const [note, tag] = await Promise.all([
        Factory.createMappedNote(application),
        Factory.createMappedTag(application),
      ])

      const backupData = (await application.createEncryptedBackupFile.execute({ skipAuthorization: true })).getValue()

      await application.sync.sync({ awaitAll: true })

      await application.mutator.deleteItem(note)
      await application.sync.sync()
      expect(application.items.findItem(note.uuid)).to.not.exist

      await application.mutator.deleteItem(tag)
      await application.sync.sync()
      expect(application.items.findItem(tag.uuid)).to.not.exist

      await application.importData(backupData, true)

      expect(application.items.getDisplayableNotes().length).to.equal(1)
      expect(application.items.findItem(note.uuid).deleted).to.not.be.ok

      expect(application.items.getDisplayableTags().length).to.equal(1)
      expect(application.items.findItem(tag.uuid).deleted).to.not.be.ok
    })

    it('should import decrypted data and all items payload source should be FileImport', async function () {
      await Factory.registerUserToApplication({
        application: application,
        email: email,
        password: password,
      })

      const [note, tag] = await Promise.all([
        Factory.createMappedNote(application),
        Factory.createMappedTag(application),
      ])

      const backupData = (await application.createEncryptedBackupFile.execute({ skipAuthorization: true })).getValue()

      await Factory.safeDeinit(application)
      application = await Factory.createInitAppWithFakeCrypto()
      Factory.handlePasswordChallenges(application, password)

      await application.importData(backupData, true)

      const importedNote = application.items.findItem(note.uuid)
      const importedTag = application.items.findItem(tag.uuid)

      expect(importedNote.payload.source).to.be.equal(PayloadSource.FileImport)
      expect(importedTag.payload.source).to.be.equal(PayloadSource.FileImport)
    })

    it('should import encrypted data and all items payload source should be FileImport', async function () {
      await Factory.registerUserToApplication({
        application: application,
        email: email,
        password: password,
      })

      const [note, tag] = await Promise.all([
        Factory.createMappedNote(application),
        Factory.createMappedTag(application),
      ])

      const backupData = (await application.createEncryptedBackupFile.execute({ skipAuthorization: true })).getValue()

      await Factory.safeDeinit(application)
      application = await Factory.createInitAppWithFakeCrypto()
      Factory.handlePasswordChallenges(application, password)

      await application.importData(backupData, true)

      const importedNote = application.items.findItem(note.uuid)
      const importedTag = application.items.findItem(tag.uuid)
      expect(importedNote.payload.source).to.be.equal(PayloadSource.FileImport)
      expect(importedTag.payload.source).to.be.equal(PayloadSource.FileImport)
    })

    it('should import data from 003 encrypted payload using client generated backup', async function () {
      const oldVersion = ProtocolVersion.V003
      await Factory.registerOldUser({
        application: application,
        email: email,
        password: password,
        version: oldVersion,
      })

      const noteItem = await application.mutator.createItem(ContentType.TYPES.Note, {
        title: 'Encrypted note',
        text: 'On protocol version 003.',
      })

      const backupData = (await application.createEncryptedBackupFile.execute({ skipAuthorization: true })).getValue()

      await Factory.safeDeinit(application)
      application = await Factory.createInitAppWithFakeCrypto()
      Factory.handlePasswordChallenges(application, password)

      const result = (await application.importData(backupData, true)).getValue()
      expect(result.affectedItems.length).to.be.eq(backupData.items.length)
      expect(result.errorCount).to.be.eq(0)

      const decryptedNote = application.items.findItem(noteItem.uuid)
      expect(decryptedNote.title).to.be.eq('Encrypted note')
      expect(decryptedNote.text).to.be.eq('On protocol version 003.')
      expect(application.items.getDisplayableNotes().length).to.equal(1)
    })

    it('should import data from 004 encrypted payload', async function () {
      await Factory.registerUserToApplication({
        application: application,
        email: email,
        password: password,
      })

      const noteItem = await application.mutator.createItem(ContentType.TYPES.Note, {
        title: 'Encrypted note',
        text: 'On protocol version 004.',
      })

      const backupData = (await application.createEncryptedBackupFile.execute({ skipAuthorization: true })).getValue()

      await Factory.safeDeinit(application)
      application = await Factory.createInitAppWithFakeCrypto()
      Factory.handlePasswordChallenges(application, password)

      const result = (await application.importData(backupData, true)).getValue()
      expect(result.affectedItems.length).to.be.eq(backupData.items.length)
      expect(result.errorCount).to.be.eq(0)

      const decryptedNote = application.items.findItem(noteItem.uuid)
      expect(decryptedNote.title).to.be.eq('Encrypted note')
      expect(decryptedNote.text).to.be.eq('On protocol version 004.')
      expect(application.items.getDisplayableNotes().length).to.equal(1)
    })

    it('should return correct errorCount', async function () {
      await Factory.registerUserToApplication({
        application: application,
        email: email,
        password: password,
      })

      const noteItem = await application.mutator.createItem(ContentType.TYPES.Note, {
        title: 'This is a valid, encrypted note',
        text: 'On protocol version 004.',
      })

      const backupData = (await application.createEncryptedBackupFile.execute({ skipAuthorization: true })).getValue()

      await Factory.safeDeinit(application)
      application = await Factory.createInitAppWithFakeCrypto()
      Factory.handlePasswordChallenges(application, password)

      const madeUpPayload = JSON.parse(JSON.stringify(noteItem))

      madeUpPayload.items_key_id = undefined
      madeUpPayload.content = '004:somenonsense'
      madeUpPayload.enc_item_key = '003:anothernonsense'
      madeUpPayload.version = '004'
      madeUpPayload.uuid = 'fake-uuid'

      backupData.items = [...backupData.items, madeUpPayload]

      const result = (await application.importData(backupData, true)).getValue()
      expect(result.affectedItems.length).to.be.eq(backupData.items.length - 1)
      expect(result.errorCount).to.be.eq(1)
    })

    it('should not import data from 003 encrypted payload if an invalid password is provided', async function () {
      const oldVersion = ProtocolVersion.V003
      await Factory.registerOldUser({
        application: application,
        email: email,
        password: UuidGenerator.GenerateUuid(),
        version: oldVersion,
      })

      await application.mutator.createItem(ContentType.TYPES.Note, {
        title: 'Encrypted note',
        text: 'On protocol version 003.',
      })

      const backupData = (await application.createEncryptedBackupFile.execute({ skipAuthorization: true })).getValue()

      await Factory.safeDeinit(application)
      application = await Factory.createInitAppWithFakeCrypto()
      application.setLaunchCallback({
        receiveChallenge: (challenge) => {
          const values = challenge.prompts.map((prompt) =>
            CreateChallengeValue(
              prompt,
              prompt.validation === ChallengeValidation.None ? 'incorrect password' : password,
            ),
          )
          application.submitValuesForChallenge(challenge, values)
        },
      })

      const result = (await application.importData(backupData, true)).getValue()

      expect(result.affectedItems.length).to.be.eq(0)
      expect(result.errorCount).to.be.eq(backupData.items.length)
      expect(application.items.getDisplayableNotes().length).to.equal(0)
    })

    it('should not import data from 004 encrypted payload if an invalid password is provided', async function () {
      await Factory.registerUserToApplication({
        application: application,
        email: email,
        password: password,
      })

      await application.mutator.createItem(ContentType.TYPES.Note, {
        title: 'This is a valid, encrypted note',
        text: 'On protocol version 004.',
      })

      const backupData = (await application.createEncryptedBackupFile.execute({ skipAuthorization: true })).getValue()

      await Factory.safeDeinit(application)
      application = await Factory.createInitAppWithFakeCrypto()
      application.setLaunchCallback({
        receiveChallenge: (challenge) => {
          const values = challenge.prompts.map((prompt) => CreateChallengeValue(prompt, 'incorrect password'))
          application.submitValuesForChallenge(challenge, values)
        },
      })

      const result = (await application.importData(backupData, true)).getValue()
      expect(result.affectedItems.length).to.be.eq(0)
      expect(result.errorCount).to.be.eq(backupData.items.length)
      expect(application.items.getDisplayableNotes().length).to.equal(0)
    })

    it('should not import encrypted data with no keyParams or auth_params', async function () {
      await Factory.registerUserToApplication({
        application: application,
        email: email,
        password: password,
      })

      await application.mutator.createItem(ContentType.TYPES.Note, {
        title: 'Encrypted note',
        text: 'On protocol version 004.',
      })

      const backupData = (await application.createEncryptedBackupFile.execute({ skipAuthorization: true })).getValue()
      delete backupData.keyParams

      await Factory.safeDeinit(application)
      application = await Factory.createInitAppWithFakeCrypto()

      const result = await application.importData(backupData)

      expect(result.isFailed()).to.be.true
    })

    it('should not import payloads if the corresponding ItemsKey is not present within the backup file', async function () {
      await Factory.registerUserToApplication({
        application: application,
        email: email,
        password: password,
      })
      Factory.handlePasswordChallenges(application, password)

      await application.mutator.createItem(ContentType.TYPES.Note, {
        title: 'Encrypted note',
        text: 'On protocol version 004.',
      })

      const backupData = (await application.createEncryptedBackupFile.execute({ skipAuthorization: true })).getValue()
      backupData.items = backupData.items.filter((payload) => payload.content_type !== ContentType.TYPES.ItemsKey)

      await Factory.safeDeinit(application)
      application = await Factory.createInitAppWithFakeCrypto()
      Factory.handlePasswordChallenges(application, password)

      const result = (await application.importData(backupData, true)).getValue()

      expect(result.affectedItems.length).to.equal(BaseItemCounts.BackupFileRootKeyEncryptedItems)

      expect(result.errorCount).to.be.eq(backupData.items.length - BaseItemCounts.BackupFileRootKeyEncryptedItems)
      expect(application.items.getDisplayableNotes().length).to.equal(0)
    })

    it('importing another accounts notes/tags should correctly keep relationships', async function () {
      await Factory.registerUserToApplication({
        application: application,
        email: email,
        password: password,
      })

      Factory.handlePasswordChallenges(application, password)

      const pair = createRelatedNoteTagPairPayload()
      await application.mutator.emitItemsFromPayloads(pair, PayloadEmitSource.LocalChanged)

      await application.sync.sync()

      const backupData = (await application.createEncryptedBackupFile.execute({ skipAuthorization: true })).getValue()

      await Factory.safeDeinit(application)
      application = await Factory.createInitAppWithFakeCrypto()
      Factory.handlePasswordChallenges(application, password)

      await Factory.registerUserToApplication({
        application: application,
        email: `${Math.random()}`,
        password: password,
      })

      await application.importData(backupData, true)

      expect(application.items.getDisplayableNotes().length).to.equal(1)
      expect(application.items.getDisplayableTags().length).to.equal(1)

      const importedNote = application.items.getDisplayableNotes()[0]
      const importedTag = application.items.getDisplayableTags()[0]
      expect(application.items.referencesForItem(importedTag).length).to.equal(1)
      expect(application.items.itemsReferencingItem(importedNote).length).to.equal(1)

      await Factory.safeDeinit(application)
    }).timeout(Factory.TwentySecondTimeout)
  })

  describe('real crypto', function () {
    let identifier = 'standardnotes'

    it('should import data from 003 encrypted payload using server generated backup with 004 key params', async function () {
      context = await Factory.createAppContextWithRealCrypto(identifier)

      await context.launch()
      application = context.application

      const backupData = {
        items: [
          {
            uuid: 'eb1b7eed-e43d-48dd-b257-b7fc8ccba3da',
            duplicate_of: null,
            items_key_id: null,
            content:
              '003:618138e365a13f8aed17d4f52e3da47d4b5d6e02004a0f827118e8a981a57c35:eb1b7eed-e43d-48dd-b257-b7fc8ccba3da:9f38642b7a3f57546520a9e32aa7c0ad:qa9rUcaD904m1Knv63dnATEHwfHJjsbq9bWb06zGTsyQxzLaAYT7uRGp2KB2g1eo5Aqxc5FqhvuF0+dE1f4+uQOeiRFNX73V2pJJY0w5Qq7l7ZuhB08ZtOMY4Ctq7evBBSIVZ+PEIfFnACelNJhsB5Uhn3kS4ZBx6qtvQ6ciSQGfYAwc6wSKhjUm1umEINeb08LNgwbP6XAm8U/la1bdtdMO112XjUW7ixkWi3POWcM=:eyJpZGVudGlmaWVyIjoicGxheWdyb3VuZEBiaXRhci5pbyIsInB3X2Nvc3QiOjExMDAwMCwicHdfbm9uY2UiOiJhZmIwYjE3NGJlYjViMmJmZTIyNTk1NDlmMTgxNDI1NzlkMDE1ZmE3ZTBhMjE4YzVmNDIxNmU0Mzg2ZGI3OWFiIiwidmVyc2lvbiI6IjAwMyJ9',
            content_type: 'Note',
            enc_item_key:
              '003:5a01e913c52899ba10c16dbe7e713dd9caf9b9554c82176ddfcf1424f5bfd94f:eb1b7eed-e43d-48dd-b257-b7fc8ccba3da:14721ff8dbdd36fb57ae4bf7414c5eab:odmq91dfaTZG/zeSUA09fD/PdB2OkiDxcQZ0FL06GPstxdvxnU17k1rtsWoA7HoNNnd5494BZ/b7YiKqUb76ddd8x3/+cTZgCa4tYxNINmb1T3wwUX0Ebxc8xynAhg6nTY/BGq+ba6jTyl8zw12dL3kBEGGglRCHnO0ZTeylwQW7asfONN8s0BwrvHdonRlx:eyJpZGVudGlmaWVyIjoicGxheWdyb3VuZEBiaXRhci5pbyIsInB3X2Nvc3QiOjExMDAwMCwicHdfbm9uY2UiOiJhZmIwYjE3NGJlYjViMmJmZTIyNTk1NDlmMTgxNDI1NzlkMDE1ZmE3ZTBhMjE4YzVmNDIxNmU0Mzg2ZGI3OWFiIiwidmVyc2lvbiI6IjAwMyJ9',
            auth_hash: null,
            created_at: '2019-05-12T02:29:21.789000Z',
            updated_at: '2019-11-12T21:47:48.382708Z',
            deleted: false,
          },
          {
            uuid: '10051be7-4ca2-4af3-aae9-021939df4fab',
            duplicate_of: null,
            items_key_id: null,
            content:
              '004:77a986823b8ffdd87164b6f541de6ed420b70ac67e055774:+8cjww1QbyXNX+PSKeCwmnysv0rAoEaKh409VWQJpDbEy/pPZCT6c0rKxLzvyMiSq6EwkOiduZMzokRgCKP7RuRqNPJceWsxNnpIUwa40KR1IP2tdreW4J8v9pFEzPMec1oq40u+c+UI/Y6ChOLV/4ozyWmpQCK3y8Ugm7B1/FzaeDs9Ie6Mvf98+XECoi0fWv9SO2TeBvq1G24LXd4zf0j8jd0sKZbLPXH0+gaUXtBH7A56lHvB0ED9NuiHI8xopTBd9ogKlz/b5+JB4zA2zQCQ3WMEE1qz6WeB2S4FMomgeO1e3trabdU0ICu0WMvDVii4qNlQo/inD41oHXKeV5QwnYoGjPrLJIaP0hiLKhDURTHygCdvWdp63OWI+aGxv0/HI+nfcRsqSE+aYECrWB/kp/c5yTrEqBEafuWZkw==:eyJrcCI6eyJpZGVudGlmaWVyIjoicGxheWdyb3VuZEBiaXRhci5pbyIsInB3X25vbmNlIjoiNjUxYWUxZWM5NTgwMzM5YTM1NjdlZTdmMGY4NjcyNDkyZGUyYzE2NmE1NTZjMTNkMTE5NzI4YTAzYzYwZjc5MyIsInZlcnNpb24iOiIwMDQiLCJvcmlnaW5hdGlvbiI6InByb3RvY29sLXVwZ3JhZGUiLCJjcmVhdGVkIjoiMTYxNDc4NDE5MjQ5NyJ9LCJ1IjoiMTAwNTFiZTctNGNhMi00YWYzLWFhZTktMDIxOTM5ZGY0ZmFiIiwidiI6IjAwNCJ9',
            content_type: 'SN|ItemsKey',
            enc_item_key:
              '004:d25deb224251b4705a44d8ce125a62f6a2f0e0e856603e8f:FEv1pfU/VfY7XhJrTfpcdhaSBfmNySTQtHohFYDm8V84KlyF5YaXRKV7BfXsa77DKTjOCU/EHHsWwhBEEfsNnzNySHxTHNc26bpoz0V8h50=:eyJrcCI6eyJpZGVudGlmaWVyIjoicGxheWdyb3VuZEBiaXRhci5pbyIsInB3X25vbmNlIjoiNjUxYWUxZWM5NTgwMzM5YTM1NjdlZTdmMGY4NjcyNDkyZGUyYzE2NmE1NTZjMTNkMTE5NzI4YTAzYzYwZjc5MyIsInZlcnNpb24iOiIwMDQiLCJvcmlnaW5hdGlvbiI6InByb3RvY29sLXVwZ3JhZGUiLCJjcmVhdGVkIjoiMTYxNDc4NDE5MjQ5NyJ9LCJ1IjoiMTAwNTFiZTctNGNhMi00YWYzLWFhZTktMDIxOTM5ZGY0ZmFiIiwidiI6IjAwNCJ9',
            auth_hash: null,
            created_at: '2020-09-07T12:22:06.562000Z',
            updated_at: '2021-03-03T15:09:55.741107Z',
            deleted: false,
          },
        ],
        auth_params: {
          identifier: 'playground@bitar.io',
          pw_nonce: '651ae1ec9580339a3567ee7f0f8672492de2c166a556c13d119728a03c60f793',
          version: '004',
        },
      }

      Factory.handlePasswordChallenges(application, 'password')

      const result = (await application.importData(backupData, true)).getValue()
      expect(result.affectedItems.length).to.be.eq(backupData.items.length)
      expect(result.errorCount).to.be.eq(0)
    })

    it('importing data with no items key should use the root key generated by the file password', async function () {
      /**
       * In SNJS 2.0.12, this file import would fail with "incorrect password" on file.
       * The reason was that we would use the default items key we had for the current account
       * instead of using the password generated root key for the file.
       *
       * Note this test will not be able to properly sync as the credentials are invalid.
       * This test is only meant to test successful local importing.
       */
      const application = await Factory.createApplicationWithRealCrypto(identifier)
      /** Create legacy migrations value so that base migration detects old app */
      await application.device.setRawStorageValue(
        'keychain',
        JSON.stringify({
          [identifier]: {
            version: '003',
            masterKey: '30bae65687b45b20100be219df983bded23868baa44f4bbef1026403daee0a9d',
            dataAuthenticationKey: 'c9b382ff1f7adb5c6cad620605ad139cd9f1e7700f507345ef1a1d46a6413712',
          },
        }),
      )
      await application.device.setRawStorageValue(
        'descriptors',
        JSON.stringify({
          [identifier]: {
            identifier: 'standardnotes',
            label: 'Main Application',
            primary: true,
          },
        }),
      )
      await application.device.setRawStorageValue('standardnotes-snjs_version', '2.0.11')
      await application.device.saveDatabaseEntry(
        {
          content:
            '003:9f2c7527eb8b2a1f8bfb3ea6b885403b6886bce2640843ebd57a6c479cbf7597:58e3322b-269a-4be3-a658-b035dffcd70f:9140b23a0fa989e224e292049f133154:SESTNOgIGf2+ZqmJdFnGU4EMgQkhKOzpZNoSzx76SJaImsayzctAgbUmJ+UU2gSQAHADS3+Z5w11bXvZgIrStTsWriwvYkNyyKmUPadKHNSBwOk4WeBZpWsA9gtI5zgI04Q5pvb8hS+kNW2j1DjM4YWqd0JQxMOeOrMIrxr/6Awn5TzYE+9wCbXZdYHyvRQcp9ui/G02ZJ67IA86vNEdjTTBAAWipWqTqKH9VDZbSQ2W/IOKfIquB373SFDKZb1S1NmBFvcoG2G7w//fAl/+ehYiL6UdiNH5MhXCDAOTQRFNfOh57HFDWVnz1VIp8X+VAPy6d9zzQH+8aws1JxHq/7BOhXrFE8UCueV6kERt9njgQxKJzd9AH32ShSiUB9X/sPi0fUXbS178xAZMJrNx3w==:eyJwd19ub25jZSI6IjRjYjEwM2FhODljZmY0NTYzYTkxMWQzZjM5NjU4M2NlZmM2ODMzYzY2Zjg4MGZiZWUwNmJkYTk0YzMxZjg2OGIiLCJwd19jb3N0IjoxMTAwMDAsImlkZW50aWZpZXIiOiJub3YyMzIyQGJpdGFyLmlvIiwidmVyc2lvbiI6IjAwMyIsIm9yaWdpbmF0aW9uIjoicmVnaXN0cmF0aW9uIn0=',
          content_type: 'SN|ItemsKey',
          created_at: new Date(),
          enc_item_key:
            '003:d7267919b07864ccc1da87a48db6c6192e2e892be29ce882e981c36f673b3847:58e3322b-269a-4be3-a658-b035dffcd70f:2384a22d8f8bf671ba6517c6e1d0be30:0qXjBDPLCcMlNTnuUDcFiJPIXU9OP6b4ttTVE58n2Jn7971xMhx6toLbAZWWLPk/ezX/19EYE9xmRngWsG4jJaZMxGZIz/melU08K7AHH3oahQpHwZvSM3iV2ufsN7liQywftdVH6NNzULnZnFX+FgEfpDquru++R4aWDLvsSegWYmde9zD62pPNUB9Kik6P:eyJwd19ub25jZSI6IjRjYjEwM2FhODljZmY0NTYzYTkxMWQzZjM5NjU4M2NlZmM2ODMzYzY2Zjg4MGZiZWUwNmJkYTk0YzMxZjg2OGIiLCJwd19jb3N0IjoxMTAwMDAsImlkZW50aWZpZXIiOiJub3YyMzIyQGJpdGFyLmlvIiwidmVyc2lvbiI6IjAwMyIsIm9yaWdpbmF0aW9uIjoicmVnaXN0cmF0aW9uIn0=',
          updated_at: new Date(),
          uuid: '58e3322b-269a-4be3-a658-b035dffcd70f',
        },
        identifier,
      )
      /**
       * Note that this storage contains "sync.standardnotes.org" as the API Host param.
       */
      await application.device.setRawStorageValue(
        'standardnotes-storage',
        JSON.stringify({
          wrapped: {
            uuid: '15af096f-4e9d-4cde-8d67-f132218fa757',
            content_type: 'SN|EncryptedStorage',
            enc_item_key:
              '003:2fb0c55859ddf0c16982b91d6202a6fb8174f711d820f8b785c558538cda5048:15af096f-4e9d-4cde-8d67-f132218fa757:09a4da52d5214e76642f0363246daa99:zt5fnmxYSZOqC+uA08oAKdtjfTdAoX1lPnbTe98CYQSlIvaePIpG5c9tAN5QzZbECkj4Lm9txwSA2O6Y4Y25rqO4lIerKjxxNqPwDze9mtPOGeoR48csUPiMIHiH78bLGZZs4VoBwYKAP+uEygXEFYRuscGnDOrFV7fnwGDL/nkhr6xpM159OTUKBgiBpVMS:eyJwd19ub25jZSI6IjRjYjEwM2FhODljZmY0NTYzYTkxMWQzZjM5NjU4M2NlZmM2ODMzYzY2Zjg4MGZiZWUwNmJkYTk0YzMxZjg2OGIiLCJwd19jb3N0IjoxMTAwMDAsImlkZW50aWZpZXIiOiJub3YyMzIyQGJpdGFyLmlvIiwidmVyc2lvbiI6IjAwMyIsIm9yaWdpbmF0aW9uIjoicmVnaXN0cmF0aW9uIn0=',
            content:
              '003:70a02948696e09211cfd34cd312dbbf85751397189da06d7acc7c46dafa9aeeb:15af096f-4e9d-4cde-8d67-f132218fa757:b92fb4b030ac51f4d3eef0ada35f3d5f:r3gdrawyd069qOQQotD5EtabTwjs4IiLFWotK0Ygbt9oAT09xILx7v92z8YALJ6i6EKHOT7zyCytR5l2B9b1J7Tls00uVgfEKs3zX7n3F6ne+ju0++WsJuy0Gre5+Olov6lqQrY3I8hWQShxaG84huZaFTIPU5+LP0JAseWWDENqUQ+Vxr+w0wqNYO6TLtr/YAqk2yOY7DLQ0WhGzK+WH9JfvS8MCccJVeBD99ebM8lKVVfTaUfrk2AlbMv47TFSjTeCDblQuU68joE45HV8Y0g2CF4nkTvdr3wn0HhdDp07YuXditX9NGtBhI8oFkstwKEksblyX9dGpn7of4ctdvNOom3Vjw/m4x9mE0lCIbjxQVAiDyy+Hg0HDtVt1j205ycg1RS7cT7+Sn746Z06S8TixcVUUUQh+MGRIulIE5utOE81Lv/p+jb2vmv+TGHUV4kZJPluG7A9IEphMZrMWwiU56FdSlSDD82qd9iG+C3Pux+X/GYCMiWS2T/BoyI6a9OERSARuTUuom2bv59hqD1yUoj7VQXhqXmverSwLE1zDeF+dc0tMwuTNCNOTk08A6wRKTR9ZjuFlLcxHsg/VZyfIdCkElFh1FrliMbW2ZsgsPFaZAI+YN8pid1tTw+Ou1cOfyD85aki98DDvg/cTi8ahrrm8UvxRQwhIW17Cm1RnKxhIvaq5HRjEN76Y46ubkZv7/HjhNwJt9vPEr9wyOrMH6XSxCnSIFD1kbVHI33q444xyUWa/EQju8SoEGGU92HhpMWd1kIz37SJRJTC7u2ah2Xg60JGcUcCNtHG3IHMPVP+UKUjx5nKP6t/NVSa+xsjIvM/ZkSL37W0TMZykC1cKfzeUmlZhGQPCIqad3b4ognZ48LGCgwBP87rWn8Ln8Cqcz7X0Ze22HoouKBPAtWlYJ8fmvg2HiW6nX/L9DqoxK4OXt/LnC2BTEvtP4PUzBqx8WoqmVNNnYp+FgYptLcgxmgckle41w1eMr6NYGeaaC1Jk3i/e9Piw0w0XjV/lB+yn03gEMYPTT2yiXMQrfPmkUNYNN7/xfhY3bqqwfER7iXdr/80Lc+x9byywChXLvg8VCjHWGd+Sky3NHyMdxLY8IqefyyZWMeXtt1aNYH6QW9DeK5KvK3DI+MK3kWwMCySe51lkE9jzcqrxpYMZjb2Za9VDZNBgdwQYXfOlxFEje0so0LlMJmmxRfbMU06bYt0vszT2szAkOnVuyi6TBRiGLyjMxYI0csM0SHZWZUQK0z7ZoQAWR5D+adX29tOvrKc2kJA8Lrzgeqw/rJIh6zPg3kmsd2rFbo+Qfe3J6XrlZU+J+N96I98i0FU0quI6HwG1zFg6UOmfRjaCML8rSAPtMaNhlO7M2sgRmDCtsNcpU06Fua6F2fEHPiXs4+9:eyJwd19ub25jZSI6IjRjYjEwM2FhODljZmY0NTYzYTkxMWQzZjM5NjU4M2NlZmM2ODMzYzY2Zjg4MGZiZWUwNmJkYTk0YzMxZjg2OGIiLCJwd19jb3N0IjoxMTAwMDAsImlkZW50aWZpZXIiOiJub3YyMzIyQGJpdGFyLmlvIiwidmVyc2lvbiI6IjAwMyIsIm9yaWdpbmF0aW9uIjoicmVnaXN0cmF0aW9uIn0=',
            created_at: '2020-11-24T00:53:42.057Z',
            updated_at: '1970-01-01T00:00:00.000Z',
          },
          nonwrapped: {
            ROOT_KEY_PARAMS: {
              pw_nonce: '4cb103aa89cff4563a911d3f396583cefc6833c66f880fbee06bda94c31f868b',
              pw_cost: 110000,
              identifier: 'nov2322@bitar.io',
              version: '003',
            },
          },
        }),
      )
      const password = 'password'

      await application.prepareForLaunch({
        receiveChallenge: (challenge) => {
          if (challenge.reason === ChallengeReason.Custom) {
            return
          }

          if (
            challenge.reason === ChallengeReason.DecryptEncryptedFile ||
            challenge.reason === ChallengeReason.ImportFile
          ) {
            application.submitValuesForChallenge(
              challenge,
              challenge.prompts.map((prompt) =>
                CreateChallengeValue(
                  prompt,
                  prompt.validation !== ChallengeValidation.ProtectionSessionDuration
                    ? password
                    : UnprotectedAccessSecondsDuration.OneMinute,
                ),
              ),
            )
          }
        },
      })
      await application.launch(false)
      await application.setHost.execute(Factory.getDefaultHost())

      const backupFile = {
        items: [
          {
            uuid: '11204d02-5a8b-47c0-ab94-ae0727d656b5',
            content_type: 'Note',
            created_at: '2020-11-23T17:11:06.322Z',
            enc_item_key:
              '003:111edcff9ed3432b9e11c4a64bef9e810ed2b9147790963caf6886511c46bbc4:11204d02-5a8b-47c0-ab94-ae0727d656b5:62de2b95cca4d7948f70516d12f5cb3a:lhUF/EoQP2DC8CSVrXyLp1yXsiJUXxwmtkwXtLUJ5sm4E0+ZNzMCO9U9ho+q6i9V+777dSbfTqODz4ZSt6hj3gtYxi9ZlOM/VrTtmJ2YcxiMaRTVl5sVZPG+YTpQPMuugN5/0EfuT/SJ9IqVbjgYhKA5xt/lMgw4JSbiW8ZkVQ5tVDfgt0omhDRLlkh758ou:eyJwd19ub25jZSI6IjNlMzU3YzQxZmI1YWU2MTUyYmZmMzY2ZjBhOGE3ZjRmZDk2NDQxZDZhNWViYzY3MDA4OTk2ZWY2YzU1YTg3ZjIiLCJwd19jb3N0IjoxMTAwMDAsImlkZW50aWZpZXIiOiJub3YyMzVAYml0YXIuaW8iLCJ2ZXJzaW9uIjoiMDAzIn0=',
            content:
              '003:d43c6d2dc9465796e01145843cf1b95031030c15cc79a73f14d941d15e28147a:11204d02-5a8b-47c0-ab94-ae0727d656b5:84a2b760019a62d7ad9c314bc7a5564a:G8Mm9fy9ybuo92VbV4NUERruJ1VA7garv1+fBg4KRDRjsRGoLvORhHldQHRfUQmSR6PkrG6ol/jOn1gjIH5gtgGczB5NgbKau7amYZHsQJPr1UleJVsLrjMJgiYGqbEDmXPtJSX2tLGFhAbYcVX4xrHKbkiuLQnu9bZp9zbR6txB1NtLoNFvwDZTMko7Q+28fM4TKBbQCCw3NufLHVUnfEwS7tLLFFPdEyyMXOerKP93u8X+7NG2eDmsUetPsPOq:eyJwd19ub25jZSI6IjNlMzU3YzQxZmI1YWU2MTUyYmZmMzY2ZjBhOGE3ZjRmZDk2NDQxZDZhNWViYzY3MDA4OTk2ZWY2YzU1YTg3ZjIiLCJwd19jb3N0IjoxMTAwMDAsImlkZW50aWZpZXIiOiJub3YyMzVAYml0YXIuaW8iLCJ2ZXJzaW9uIjoiMDAzIn0=',
            auth_hash: null,
            updated_at: '2020-11-23T17:11:40.399Z',
          },
        ],
        auth_params: {
          pw_nonce: '3e357c41fb5ae6152bff366f0a8a7f4fd96441d6a5ebc67008996ef6c55a87f2',
          pw_cost: 110000,
          identifier: 'nov235@bitar.io',
          version: '003',
        },
      }

      const result = (await application.importData(backupFile, false)).getValue()
      expect(result.errorCount).to.equal(0)
      await Factory.safeDeinit(application)
    })
  })
})

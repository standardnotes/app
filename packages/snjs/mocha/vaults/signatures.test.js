import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('signatures', function () {
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

  describe('item decryption signature verification', () => {
    it('should have failing signature if contact public key does not match', async () => {
      const { note, contactContext, deinitContactContext } =
        await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

      const regularContact = contactContext.contacts.findContact(context.userUuid)
      const decoyContact = new TrustedContact(
        regularContact.payload.copy({
          content: {
            ...regularContact.payload.content,
            publicKeySet: ContactPublicKeySet.FromJson({
              ...regularContact.payload.content.publicKeySet,
              encryption: 'invalid public key',
              signing: 'invalid signing public key',
            }),
          },
        }),
      )

      contactContext.items.collection.onChange({
        changed: [decoyContact],
        inserted: [],
        discarded: [],
        ignored: [],
        unerrored: [],
      })

      await context.changeNoteTitle(note, 'new title')

      await contactContext.sync()

      const contactNote = contactContext.items.findItem(note.uuid)

      /** Signature data only verifies whether the embedded signature and embedded signature public key match up */
      expect(contactNote.signatureData.required).to.be.true
      expect(contactNote.signatureData.result.passes).to.be.true

      const status = contactContext.contacts.getItemSignatureStatus(contactNote)
      expect(status).to.equal(ItemSignatureValidationResult.NotTrusted)

      await deinitContactContext()
    })
  })

  describe('UI signature status check', () => {
    it('signatures should be trusted with root public key', async () => {
      const { note, contactContext, deinitContactContext } =
        await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

      const contactNote = contactContext.items.findItem(note.uuid)

      const status = contactContext.contacts.getItemSignatureStatus(contactNote)

      expect(status).to.equal(ItemSignatureValidationResult.Trusted)

      await deinitContactContext()
    })

    it('signatures return SignedWithNonCurrentKey when signed with non root contact public key', async () => {
      const { note, contactContext, deinitContactContext } =
        await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

      await context.changePassword('new password')

      await contactContext.sync()

      const contactNote = contactContext.items.findItem(note.uuid)

      const status = contactContext.contacts.getItemSignatureStatus(contactNote)

      expect(status).to.equal(ItemSignatureValidationResult.SignedWithNonCurrentKey)

      await deinitContactContext()
    })

    it('syncing a SignedWithNonCurrentKey item should reset its status', async () => {
      const { note, contactContext, deinitContactContext } =
        await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

      await context.changePassword('new password')

      await contactContext.sync()

      const contactNote = contactContext.items.findItem(note.uuid)

      const latestNote = await contactContext.changeNoteTitle(contactNote, 'new title')

      const status = contactContext.contacts.getItemSignatureStatus(latestNote)

      expect(status).to.equal(ItemSignatureValidationResult.NotApplicable)

      await deinitContactContext()
    })

    it('should return NotApplicable if item does not belong to shared vault', async () => {
      const item = await context.createSyncedNote()

      const status = context.contacts.getItemSignatureStatus(item)

      expect(status).to.equal(ItemSignatureValidationResult.NotApplicable)
    })
  })
})

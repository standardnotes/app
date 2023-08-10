import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('shared vault crypto', function () {
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

  describe('root key', () => {
    it('root key loaded from disk should have keypairs', async () => {
      const appIdentifier = context.identifier
      await context.deinit()

      let recreatedContext = await Factory.createVaultsContextWithRealCrypto(appIdentifier)
      await recreatedContext.launch()

      expect(recreatedContext.keyPair).to.not.be.undefined
      expect(recreatedContext.signingKeyPair).to.not.be.undefined

      await recreatedContext.deinit()
    })

    it('changing user password should re-encrypt all key system root keys and contacts with new user root key', async () => {
      await Collaboration.createPrivateVault(context)
      const spy = context.spyOnFunctionResult(context.application.sync, 'payloadsByPreparingForServer')
      await context.changePassword('new_password')

      const payloads = await spy
      const keyPayloads = payloads.filter(
        (payload) =>
          payload.content_type === ContentType.TYPES.KeySystemRootKey ||
          payload.content_type === ContentType.TYPES.TrustedContact,
      )
      expect(keyPayloads.length).to.equal(2)

      for (const payload of payloads) {
        const keyParams = context.encryption.getEmbeddedPayloadAuthenticatedData(new EncryptedPayload(payload)).kp

        const userKeyParams = context.encryption.getRootKeyParams().content
        expect(keyParams).to.eql(userKeyParams)
      }
    })
  })

  describe('persistent content signature', () => {
    it('storage payloads should include signatureData', async () => {
      const { note, contactContext, deinitContactContext } =
        await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

      await contactContext.changeNoteTitleAndSync(note, 'new title')

      await context.sync()

      const rawPayloads = await context.application.storage.getAllRawPayloads()
      const noteRawPayload = rawPayloads.find((payload) => payload.uuid === note.uuid)

      expect(noteRawPayload.signatureData).to.not.be.undefined

      await deinitContactContext()
    })

    it('changing item content should erase existing signatureData', async () => {
      const { note, contactContext, deinitContactContext } =
        await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

      await contactContext.changeNoteTitleAndSync(note, 'new title')
      await context.sync()

      let updatedNote = context.items.findItem(note.uuid)
      await context.changeNoteTitleAndSync(updatedNote, 'new title 2')

      updatedNote = context.items.findItem(note.uuid)
      expect(updatedNote.signatureData).to.be.undefined

      await deinitContactContext()
    })

    it('encrypting an item into storage then loading it should verify authenticity of original content rather than most recent symmetric signature', async () => {
      const { note, contactContext, deinitContactContext } =
        await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

      const contactNote = contactContext.items.findItem(note.uuid)

      await contactContext.changeNoteTitleAndSync(contactNote, 'new title')

      /** Override decrypt result to return failing signature */
      const objectToSpy = context.encryption
      sinon.stub(objectToSpy, 'decryptSplit').callsFake(async (split) => {
        objectToSpy.decryptSplit.restore()

        const decryptedPayloads = await objectToSpy.decryptSplit(split)
        expect(decryptedPayloads.length).to.equal(1)
        expect(decryptedPayloads[0].content_type).to.equal(ContentType.TYPES.Note)

        const payload = decryptedPayloads[0]
        const mutatedPayload = new DecryptedPayload({
          ...payload.ejected(),
          signatureData: {
            ...payload.signatureData,
            result: {
              ...payload.signatureData.result,
              passes: false,
            },
          },
        })

        return [mutatedPayload]
      })

      await context.sync()

      let updatedNote = context.items.findItem(note.uuid)
      expect(updatedNote.content.title).to.equal('new title')
      expect(updatedNote.signatureData.result.passes).to.equal(false)

      const appIdentifier = context.identifier
      await context.deinit()

      let recreatedContext = await Factory.createVaultsContextWithRealCrypto(appIdentifier)
      await recreatedContext.launch()

      updatedNote = recreatedContext.items.findItem(note.uuid)
      expect(updatedNote.signatureData.result.passes).to.equal(false)

      /** Changing the content now should clear failing signature */
      await recreatedContext.changeNoteTitleAndSync(updatedNote, 'new title 2')
      updatedNote = recreatedContext.items.findItem(note.uuid)
      expect(updatedNote.signatureData).to.be.undefined

      await recreatedContext.deinit()

      recreatedContext = await Factory.createVaultsContextWithRealCrypto(appIdentifier)
      await recreatedContext.launch()

      /** Decrypting from storage will now verify current user symmetric signature only */
      updatedNote = recreatedContext.items.findItem(note.uuid)
      expect(updatedNote.signatureData.result.passes).to.equal(true)

      await recreatedContext.deinit()
      await deinitContactContext()
    })
  })

  describe('symmetrically encrypted items', () => {
    it('created items with a payload source of remote saved should not have signature data', async () => {
      const note = await context.createSyncedNote()

      expect(note.payload.source).to.equal(PayloadSource.RemoteSaved)

      expect(note.signatureData).to.be.undefined
    })

    it('retrieved items that are then remote saved should have their signature data cleared', async () => {
      const { note, contactContext, deinitContactContext } =
        await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

      await contactContext.changeNoteTitleAndSync(contactContext.items.findItem(note.uuid), 'new title')

      await context.sync()
      expect(context.items.findItem(note.uuid).signatureData).to.not.be.undefined

      await context.changeNoteTitleAndSync(context.items.findItem(note.uuid), 'new title')
      expect(context.items.findItem(note.uuid).signatureData).to.be.undefined

      await deinitContactContext()
    })

    it('should allow client verification of authenticity of shared item changes', async () => {
      const { note, contactContext, deinitContactContext } =
        await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

      expect(context.contacts.getItemSignatureStatus(note)).to.equal(ItemSignatureValidationResult.NotApplicable)

      const contactNote = contactContext.items.findItem(note.uuid)

      expect(contactContext.contacts.getItemSignatureStatus(contactNote)).to.equal(
        ItemSignatureValidationResult.Trusted,
      )

      await contactContext.changeNoteTitleAndSync(contactNote, 'new title')

      await context.sync()

      let updatedNote = context.items.findItem(note.uuid)

      expect(context.contacts.getItemSignatureStatus(updatedNote)).to.equal(ItemSignatureValidationResult.Trusted)

      await deinitContactContext()
    })
  })
})

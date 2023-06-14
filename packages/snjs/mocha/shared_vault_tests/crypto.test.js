import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe.only('shared vault crypto', function () {
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

  describe('root key', () => {
    it('root key loaded from disk should have keypairs', async () => {
      const appIdentifier = context.identifier
      await context.deinit()

      let recreatedContext = await Factory.createAppContextWithRealCrypto(appIdentifier)
      await recreatedContext.launch()

      expect(recreatedContext.encryption.getKeyPair()).to.not.be.undefined
      expect(recreatedContext.encryption.getSigningKeyPair()).to.not.be.undefined
    })
  })

  describe('persistent content signature', () => {
    it('storage payloads should include signatureData', async () => {
      const { note, contactContext, deinitContactContext } =
        await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

      await contactContext.changeNoteTitleAndSync(note, 'new title')
      await context.sync()

      const rawPayloads = await context.application.diskStorageService.getAllRawPayloads()
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

      await contactContext.changeNoteTitleAndSync(note, 'new title')

      /** Override decrypt result to return failing signature */
      const objectToSpy = context.encryption
      sinon.stub(objectToSpy, 'decryptSplit').callsFake(async (split) => {
        objectToSpy.decryptSplit.restore()

        const decryptedPayloads = await objectToSpy.decryptSplit(split)
        expect(decryptedPayloads.length).to.equal(1)

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

      let recreatedContext = await Factory.createAppContextWithRealCrypto(appIdentifier)
      await recreatedContext.launch()

      updatedNote = recreatedContext.items.findItem(note.uuid)
      expect(updatedNote.signatureData.result.passes).to.equal(false)

      /** Changing the content now should clear failing signature */
      await recreatedContext.changeNoteTitleAndSync(updatedNote, 'new title 2')
      updatedNote = recreatedContext.items.findItem(note.uuid)
      expect(updatedNote.signatureData).to.be.undefined

      await recreatedContext.deinit()

      recreatedContext = await Factory.createAppContextWithRealCrypto(appIdentifier)
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

      expect(context.contacts.isItemAuthenticallySigned(note)).to.equal('not-applicable')

      const contactNote = contactContext.items.findItem(note.uuid)

      expect(contactContext.contacts.isItemAuthenticallySigned(contactNote)).to.equal('yes')

      await contactContext.changeNoteTitleAndSync(contactNote, 'new title')

      await context.sync()

      let updatedNote = context.items.findItem(note.uuid)

      expect(context.contacts.isItemAuthenticallySigned(updatedNote)).to.equal('yes')

      await deinitContactContext()
    })
  })

  describe('keypair revocation', () => {
    it('should be able to revoke non-current keypair', async () => {
      console.error('TODO')
    })

    it('revoking a keypair should send a keypair revocation event to trusted contacts', async () => {
      console.error('TODO')
    })

    it('should not be able to revoke current key pair', async () => {
      console.error('TODO')
    })

    it('should distrust revoked keypair as contact', async () => {
      console.error('TODO')
    })
  })
})

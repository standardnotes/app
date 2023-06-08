import * as Factory from './lib/factory.js'
import * as Collaboration from './lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('contacts', function () {
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

  it('should create contact', async () => {
    const contact = await context.contacts.createOrEditTrustedContact({
      name: 'John Doe',
      publicKey: 'my_public_key',
      contactUuid: '123',
    })

    expect(contact).to.not.be.undefined
    expect(contact.name).to.equal('John Doe')
    expect(contact.publicKey).to.equal('my_public_key')
    expect(contact.contactUuid).to.equal('123')
  })

  it('performing a sync should download new contact changes and keep them pending', async () => {
    const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
    await Collaboration.createTrustedContactForUserOfContext(context, contactContext)
    const originalContact = context.contacts.findTrustedContact(contactContext.userUuid)

    const oldPublicKey = contactContext.publicKey
    await contactContext.changePassword('new_password')
    await context.sync()
    const newPublicKey = contactContext.publicKey

    expect(oldPublicKey).to.not.equal(newPublicKey)

    const serverContacts = context.contacts.getServerContacts()
    expect(serverContacts.length).to.equal(1)
    expect(serverContacts[0].contact_public_key).to.not.equal(originalContact.publicKey)
    expect(serverContacts[0].contact_public_key).to.equal(contactContext.publicKey)

    const unchangedTrustedContent = context.contacts.findTrustedContact(contactContext.userUuid)
    expect(originalContact.publicKey).to.equal(unchangedTrustedContent.publicKey)
    expect(unchangedTrustedContent.publicKey).to.not.equal(serverContacts[0].contact_public_key)

    await deinitContactContext()
  })

  it('should update trusted contact model when accepting incoming contact change', async () => {
    const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
    await Collaboration.createTrustedContactForUserOfContext(context, contactContext)
    await Collaboration.createTrustedContactForUserOfContext(contactContext, context)

    const originalContactRecord = context.contacts.findTrustedContact(contactContext.userUuid)

    await contactContext.changePassword('new_password')
    await context.sync()

    const pendingRequests = context.contacts.getServerContacts()
    expect(pendingRequests.length).to.equal(1)
    expect(pendingRequests[0].contact_public_key).to.equal(contactContext.publicKey)

    await context.contacts.trustServerContact(pendingRequests[0])

    const updatedContactRecord = context.contacts.findTrustedContact(contactContext.userUuid)
    expect(updatedContactRecord).to.not.be.undefined
    expect(updatedContactRecord.publicKey).to.not.equal(originalContactRecord.publicKey)
    expect(updatedContactRecord.publicKey).to.equal(contactContext.publicKey)

    await deinitContactContext()
  })

  it('should delete contact', async () => {
    console.error('TODO: implement test case')
  })
})

import * as Factory from '../lib/factory.js'

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
      signingPublicKey: 'my_signing_public_key',
      contactUuid: '123',
    })

    expect(contact).to.not.be.undefined
    expect(contact.name).to.equal('John Doe')
    expect(contact.publicKeySet.encryption).to.equal('my_public_key')
    expect(contact.publicKeySet.signing).to.equal('my_signing_public_key')
    expect(contact.contactUuid).to.equal('123')
  })

  it('should create self contact on registration', async () => {
    const selfContact = context.contacts.getSelfContact()

    expect(selfContact).to.not.be.undefined

    expect(selfContact.publicKeySet.encryption).to.equal(context.publicKey)
    expect(selfContact.publicKeySet.signing).to.equal(context.signingPublicKey)
  })

  it('should create self contact on sign in if it does not exist', async () => {
    let selfContact = context.contacts.getSelfContact()
    await context.mutator.setItemToBeDeleted(selfContact)
    await context.sync()
    await context.signout()

    await context.signIn()
    selfContact = context.contacts.getSelfContact()
    expect(selfContact).to.not.be.undefined
  })

  it('should update self contact on password change', async () => {
    const selfContact = context.contacts.getSelfContact()

    await context.changePassword('new_password')

    const updatedSelfContact = context.contacts.getSelfContact()

    expect(updatedSelfContact.publicKeySet.encryption).to.not.equal(selfContact.publicKeySet.encryption)
    expect(updatedSelfContact.publicKeySet.signing).to.not.equal(selfContact.publicKeySet.signing)

    expect(updatedSelfContact.publicKeySet.encryption).to.equal(context.publicKey)
    expect(updatedSelfContact.publicKeySet.signing).to.equal(context.signingPublicKey)
  })

  it('should update self contact reference when changed', async () => {
    const selfContact = context.contacts.getSelfContact()

    await context.mutator.changeItem(selfContact, (mutator) => {
      mutator.name = 'New Name'
    })

    const updatedSelfContact = context.contacts.getSelfContact()

    expect(updatedSelfContact.name).to.equal('New Name')
  })

  it('should not be able to delete self contact', async () => {
    const selfContact = context.contacts.getSelfContact()

    await Factory.expectThrowsAsync(() => context.contacts.deleteContact(selfContact), 'Cannot delete self')
  })

  it('should not be able to delete a trusted contact if it belongs to a vault I administer', async () => {
    console.error('TODO: implement test')
  })

  it('should be able to refresh a contact using a collaborationID that includes full chain of previouos public keys', async () => {
    console.error('TODO: implement test')
  })
})

import * as Factory from './factory.js'

export const createContactContext = async () => {
  const contactContext = await Factory.createAppContextWithRealCrypto()
  await contactContext.launch()
  await contactContext.register()

  return {
    contactContext,
    deinitContactContext: contactContext.deinit.bind(contactContext),
  }
}

export const createTrustedContactForUserOfContext = async (
  contextAddingNewContact,
  contextImportingContactInfoFrom,
) => {
  const contact = await contextAddingNewContact.application.contactService.createTrustedContact({
    name: 'John Doe',
    publicKey: contextImportingContactInfoFrom.publicKey,
    contactUuid: contextImportingContactInfoFrom.userUuid,
  })

  return contact
}

export const acceptAllInvites = async (inContext) => {
  const invites = inContext.groups.getCachedInboundInvites()
  for (const invite of invites) {
    const result = await inContext.groups.acceptInvite(invite)
    expect(result).to.be.true
  }
}

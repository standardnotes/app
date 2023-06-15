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
  const contact = await contextAddingNewContact.application.contactService.createOrEditTrustedContact({
    name: 'John Doe',
    publicKey: contextImportingContactInfoFrom.publicKey,
    signingPublicKey: contextImportingContactInfoFrom.signingPublicKey,
    contactUuid: contextImportingContactInfoFrom.userUuid,
  })

  return contact
}

export const acceptAllInvites = async (context) => {
  const inviteRecords = context.sharedVaults.getCachedPendingInviteRecords()
  for (const record of inviteRecords) {
    await context.sharedVaults.acceptPendingSharedVaultInvite(record)
  }
}

export const createSharedVaultWithAcceptedInvite = async (context, permissions = SharedVaultPermission.Write) => {
  const { sharedVault, contact, contactContext, deinitContactContext } =
    await createSharedVaultWithUnacceptedButTrustedInvite(context, permissions)

  const promise = contactContext.awaitNextSyncSharedVaultFromScratchEvent()

  await acceptAllInvites(contactContext)

  await promise

  return { sharedVault, contact, contactContext, deinitContactContext }
}

export const createSharedVaultWithAcceptedInviteAndNote = async (
  context,
  permissions = SharedVaultPermission.Write,
) => {
  const { sharedVault, contactContext, contact, deinitContactContext } = await createSharedVaultWithAcceptedInvite(
    context,
    permissions,
  )
  const note = await context.createSyncedNote('foo', 'bar')
  const updatedNote = await addItemToVault(context, sharedVault, note)
  await contactContext.sync()

  return { sharedVault, note: updatedNote, contact, contactContext, deinitContactContext }
}

export const createSharedVaultWithUnacceptedButTrustedInvite = async (
  context,
  permissions = SharedVaultPermission.Write,
) => {
  const sharedVault = await createSharedVault(context)

  const { contactContext, deinitContactContext } = await createContactContext()
  const contact = await createTrustedContactForUserOfContext(context, contactContext)
  await createTrustedContactForUserOfContext(contactContext, context)

  const invite = await context.sharedVaults.inviteContactToSharedVault(sharedVault, contact, permissions)
  await contactContext.sync()

  return { sharedVault, contact, contactContext, deinitContactContext, invite }
}

export const createSharedVaultWithUnaccepteAndUntrustedInvite = async (
  context,
  permissions = SharedVaultPermission.Write,
) => {
  const sharedVault = await createSharedVault(context)

  const { contactContext, deinitContactContext } = await createContactContext()
  const contact = await createTrustedContactForUserOfContext(context, contactContext)

  const invite = await context.sharedVaults.inviteContactToSharedVault(sharedVault, contact, permissions)
  await contactContext.sync()

  return { sharedVault, contact, contactContext, deinitContactContext, invite }
}

export const inviteThirdPartyToSharedVault = async (
  context,
  sharedVault,
  permissions = SharedVaultPermission.Write,
) => {
  const { contactContext: thirdPartyContext, deinitContactContext: deinitThirdPartyContext } =
    await createContactContext()

  const thirdPartyContact = await createTrustedContactForUserOfContext(context, thirdPartyContext)
  await context.sharedVaults.inviteContactToSharedVault(sharedVault, thirdPartyContact, permissions)

  return { thirdPartyContext, thirdPartyContact, deinitThirdPartyContext }
}

export const createSharedVault = async (context) => {
  const sharedVault = await context.sharedVaults.createSharedVault('My Shared Vault')
  return sharedVault
}

export const createSharedVaultWithNote = async (context) => {
  const sharedVault = await createSharedVault(context)
  const note = await context.createSyncedNote()
  const updatedNote = await addItemToVault(context, sharedVault, note)
  return { sharedVault, note: updatedNote }
}

export const addItemToVault = async (context, sharedVault, item) => {
  const promise = context.resolveWhenItemCompletesAddingToVault(item)
  const updatedItem = await context.vaults.addItemToVault(sharedVault, item)
  await promise
  return updatedItem
}

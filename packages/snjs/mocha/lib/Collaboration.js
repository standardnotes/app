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

export const acceptAllInvites = async (context) => {
  const invites = context.sharedVaults.getCachedInboundInvites()
  for (const invite of invites) {
    const result = await context.sharedVaults.acceptInvite(invite)
    if (!result) {
      throw new Error('[e2e] Failed to accept invite')
    }
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
  await addItemToVault(context, sharedVault, note)
  await contactContext.sync()

  return { sharedVault, note, contact, contactContext, deinitContactContext }
}

export const createSharedVaultWithUnacceptedButTrustedInvite = async (
  context,
  permissions = SharedVaultPermission.Write,
) => {
  const sharedVault = await createSharedVault(context)

  const { contactContext, deinitContactContext } = await createContactContext()
  const contact = await createTrustedContactForUserOfContext(context, contactContext)

  const invite = await context.sharedVaults.inviteContactToSharedVault(sharedVault, contact, permissions)
  await contactContext.sync()

  await createTrustedContactForUserOfContext(contactContext, context)

  return { sharedVault, contact, contactContext, deinitContactContext, invite }
}

export const createSharedVault = async (context) => {
  const sharedVault = await context.sharedVaults.createSharedVault('My Shared Vault')
  return sharedVault
}

export const createSharedVaultWithNote = async (context) => {
  const sharedVault = await createSharedVault(context)
  const note = await context.createSyncedNote()
  await addItemToVault(context, sharedVault, note)
  return { sharedVault, note }
}

export const addItemToVault = async (context, sharedVault, item) => {
  const promise = context.resolveWhenItemCompletesAddingToVault(item)
  await context.vaults.addItemToVault(sharedVault, item)
  await promise
}

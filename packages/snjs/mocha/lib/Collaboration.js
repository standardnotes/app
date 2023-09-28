import * as Factory from './factory.js'
import * as Utils from './Utils.js'

export const createContactContext = async () => {
  const contactContext = await Factory.createVaultsContextWithRealCrypto()
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
  const syncPromisme = contextAddingNewContact.awaitNextSucessfulSync()

  const contact = await contextAddingNewContact.contacts.createOrEditTrustedContact({
    name: 'John Doe',
    publicKey: contextImportingContactInfoFrom.publicKey,
    signingPublicKey: contextImportingContactInfoFrom.signingPublicKey,
    contactUuid: contextImportingContactInfoFrom.userUuid,
  })

  await syncPromisme

  return contact
}

export const acceptAllInvites = async (context) => {
  const inviteRecords = context.vaultInvites.getCachedPendingInviteRecords()
  if (inviteRecords.length === 0) {
    throw new Error('No pending invites to accept')
  }

  for (const record of inviteRecords) {
    await context.vaultInvites.acceptInvite(record)
  }
}

export const inviteContext = async (context, contactContext, sharedVault, contact, permission) => {
  contactContext.lockSyncing()

  const inviteOrError = await context.vaultInvites.inviteContactToSharedVault(sharedVault, contact, permission)
  if (inviteOrError.isFailed()) {
    throw new Error(inviteOrError.getError())
  }

  const invite = inviteOrError.getValue()

  const promise = contactContext.resolveWhenAsyncFunctionCompletes(contactContext.vaultInvites, 'processInboundInvites')

  contactContext.unlockSyncing()
  await contactContext.sync()

  await Utils.awaitPromiseOrThrow(promise, 2.0, '[inviteContext] processInboundInvites was not called in time')

  const inviteRecords = contactContext.vaultInvites.getCachedPendingInviteRecords()
  if (inviteRecords.length === 0) {
    throw new Error('Invite was not properly received')
  }

  return invite
}

export const createSharedVaultWithAcceptedInvite = async (
  context,
  permission = SharedVaultUserPermission.PERMISSIONS.Write,
) => {
  const { sharedVault, contact, contactContext, deinitContactContext } =
    await createSharedVaultWithUnacceptedButTrustedInvite(context, permission)

  const promise = contactContext.awaitNextSyncSharedVaultFromScratchEvent()

  await acceptAllInvites(contactContext)

  await Utils.awaitPromiseOrThrow(promise, 2.0, 'Waiting for vault to sync')

  const contactVaultOrError = contactContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier })
  if (contactVaultOrError.isFailed()) {
    throw new Error(contactVaultOrError.getError())
  }
  const contactVault = contactVaultOrError.getValue()

  return { sharedVault, contact, contactVault, contactContext, deinitContactContext }
}

export const createSharedVaultWithAcceptedInviteAndNote = async (
  context,
  permission = SharedVaultUserPermission.PERMISSIONS.Write,
) => {
  const { sharedVault, contactContext, contact, deinitContactContext } = await createSharedVaultWithAcceptedInvite(
    context,
    permission,
  )
  const note = await context.createSyncedNote('foo', 'bar')
  const updatedNote = await moveItemToVault(context, sharedVault, note)

  const promise = contactContext.awaitNextSucessfulSync()
  await contactContext.sync()
  await Utils.awaitPromiseOrThrow(promise, 2.0, 'Waiting for contactContext to sync added note')

  return { sharedVault, note: updatedNote, contact, contactContext, deinitContactContext }
}

export const createSharedVaultWithUnacceptedButTrustedInvite = async (
  context,
  permission = SharedVaultUserPermission.PERMISSIONS.Write,
) => {
  const sharedVault = await createSharedVault(context)

  const { contactContext, deinitContactContext } = await createContactContext()
  const contact = await createTrustedContactForUserOfContext(context, contactContext)
  await createTrustedContactForUserOfContext(contactContext, context)

  const invite = await inviteContext(context, contactContext, sharedVault, contact, permission)

  return { sharedVault, contact, contactContext, deinitContactContext, invite }
}

export const createSharedVaultAndInviteContact = async (
  context,
  contactContext,
  contact,
  permission = SharedVaultUserPermission.PERMISSIONS.Write,
) => {
  const sharedVault = await createSharedVault(context)

  await inviteContext(context, contactContext, sharedVault, contact, permission)

  return { sharedVault }
}

export const createSharedVaultWithUnacceptedAndUntrustedInvite = async (
  context,
  permission = SharedVaultUserPermission.PERMISSIONS.Write,
) => {
  const sharedVault = await createSharedVault(context)

  const { contactContext, deinitContactContext } = await createContactContext()
  const contact = await createTrustedContactForUserOfContext(context, contactContext)

  const invite = (await context.vaultInvites.inviteContactToSharedVault(sharedVault, contact, permission)).getValue()

  const promise = contactContext.resolveWhenAsyncFunctionCompletes(contactContext.vaultInvites, 'processInboundInvites')

  await contactContext.sync()

  await Utils.awaitPromiseOrThrow(
    promise,
    2.0,
    '[createSharedVaultWithUnacceptedAndUntrustedInvite] Waiting to process invites',
  )

  return { sharedVault, contact, contactContext, deinitContactContext, invite }
}

export const inviteNewPartyToSharedVault = async (
  context,
  sharedVault,
  permission = SharedVaultUserPermission.PERMISSIONS.Write,
) => {
  const { contactContext: thirdPartyContext, deinitContactContext: deinitThirdPartyContext } =
    await createContactContext()

  const thirdPartyContact = await createTrustedContactForUserOfContext(context, thirdPartyContext)

  await createTrustedContactForUserOfContext(thirdPartyContext, context)

  await inviteContext(context, thirdPartyContext, sharedVault, thirdPartyContact, permission)

  return { thirdPartyContext, thirdPartyContact, deinitThirdPartyContext }
}

export const createPrivateVault = async (context) => {
  const privateVault = await context.vaults.createRandomizedVault({
    name: 'My Private Vault',
  })

  return privateVault
}

export const createSharedVault = async (context) => {
  const sharedVault = await context.sharedVaults.createSharedVault({ name: 'My Shared Vault' })

  if (isClientDisplayableError(sharedVault)) {
    throw new Error(sharedVault.text)
  }

  return sharedVault
}

export const createSharedVaultWithNote = async (context) => {
  const sharedVault = await createSharedVault(context)
  const note = await context.createSyncedNote()
  const updatedNote = await moveItemToVault(context, sharedVault, note)
  return { sharedVault, note: updatedNote }
}

export const moveItemToVault = async (context, sharedVault, item) => {
  const promise = context.resolveWhenItemCompletesAddingToVault(item)
  const result = await context.vaults.moveItemToVault(sharedVault, item)
  await promise

  if (result.isFailed()) {
    throw new Error(result.getError())
  }

  return result.getValue()
}

export const designateSharedVaultSurvior = async (context, sharedVault, survivorUuid) => {
  const result = await context.vaultUsers.designateSurvivor(sharedVault, survivorUuid)
  if (result.isFailed()) {
    throw new Error(result.getError())
  }

  return result.getValue()
}

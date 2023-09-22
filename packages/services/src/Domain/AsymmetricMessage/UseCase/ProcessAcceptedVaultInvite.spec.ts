import { CreateOrEditContact } from './../../Contacts/UseCase/CreateOrEditContact'
import { MutatorClientInterface } from '../../Mutator/MutatorClientInterface'
import { ProcessAcceptedVaultInvite } from './ProcessAcceptedVaultInvite'
import { SyncServiceInterface } from '../../Sync/SyncServiceInterface'
import { ContentType } from '@standardnotes/domain-core'
import {
  AsymmetricMessagePayloadType,
  AsymmetricMessageSharedVaultInvite,
  KeySystemRootKeyContent,
} from '@standardnotes/models'

describe('ProcessAcceptedVaultInvite', () => {
  let mutator: jest.Mocked<MutatorClientInterface>
  let sync: jest.Mocked<SyncServiceInterface>
  let createOrEditContact: jest.Mocked<CreateOrEditContact>

  beforeEach(() => {
    mutator = {} as jest.Mocked<MutatorClientInterface>
    mutator.createItem = jest.fn()

    sync = {} as jest.Mocked<SyncServiceInterface>
    sync.sync = jest.fn()

    createOrEditContact = {} as jest.Mocked<CreateOrEditContact>
    createOrEditContact.execute = jest.fn()
  })

  it('should create root key before creating vault listing so that propagated vault listings do not appear as locked', async () => {
    const handleTrustedSharedVaultInviteMessage = new ProcessAcceptedVaultInvite(mutator, sync, createOrEditContact)
    createOrEditContact
    const testMessage = {
      type: AsymmetricMessagePayloadType.SharedVaultInvite,
      data: {
        recipientUuid: 'test-recipient-uuid',
        rootKey: {
          systemIdentifier: 'test-system-identifier',
        } as jest.Mocked<KeySystemRootKeyContent>,
        metadata: {
          name: 'test-name',
          iconString: 'safe-square',
          fileBytesUsed: 0,
          designatedSurvivor: null,
        },
        trustedContacts: [],
      },
    } as jest.Mocked<AsymmetricMessageSharedVaultInvite>

    const sharedVaultUuid = 'test-shared-vault-uuid'
    const senderUuid = 'test-sender-uuid'

    await handleTrustedSharedVaultInviteMessage.execute(testMessage, sharedVaultUuid, senderUuid)

    const keySystemRootKeyCallIndex = mutator.createItem.mock.calls.findIndex(
      ([contentType]) => contentType === ContentType.TYPES.KeySystemRootKey,
    )

    const vaultListingCallIndex = mutator.createItem.mock.calls.findIndex(
      ([contentType]) => contentType === ContentType.TYPES.VaultListing,
    )

    expect(keySystemRootKeyCallIndex).toBeLessThan(vaultListingCallIndex)
  })
})

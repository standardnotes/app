import { HandleTrustedSharedVaultInviteMessage } from './HandleTrustedSharedVaultInviteMessage'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { SyncServiceInterface } from '../../Sync/SyncServiceInterface'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { ContentType } from '@standardnotes/common'
import {
  AsymmetricMessagePayloadType,
  AsymmetricMessageSharedVaultInvite,
  KeySystemRootKeyContent,
} from '@standardnotes/models'

describe('HandleTrustedSharedVaultInviteMessage', () => {
  let itemsMock: jest.Mocked<ItemManagerInterface>
  let syncServiceMock: jest.Mocked<SyncServiceInterface>
  let contactServiceMock: jest.Mocked<ContactServiceInterface>

  beforeEach(() => {
    itemsMock = {
      createItem: jest.fn(),
    } as any

    syncServiceMock = {
      sync: jest.fn(),
    } as any

    contactServiceMock = {
      createOrEditTrustedContact: jest.fn(),
    } as any
  })

  it('should create root key before creating vault listing so that propagated vault listings do not appear as locked', async () => {
    const handleTrustedSharedVaultInviteMessage = new HandleTrustedSharedVaultInviteMessage(
      itemsMock,
      syncServiceMock,
      contactServiceMock,
    )

    const testMessage = {
      type: AsymmetricMessagePayloadType.SharedVaultInvite,
      data: {
        recipientUuid: 'test-recipient-uuid',
        rootKey: {
          systemIdentifier: 'test-system-identifier',
        } as jest.Mocked<KeySystemRootKeyContent>,
        metadata: {
          name: 'test-name',
        },
        trustedContacts: [],
      },
    } as jest.Mocked<AsymmetricMessageSharedVaultInvite>

    const sharedVaultUuid = 'test-shared-vault-uuid'
    const senderUuid = 'test-sender-uuid'

    await handleTrustedSharedVaultInviteMessage.execute(testMessage, sharedVaultUuid, senderUuid)

    const keySystemRootKeyCallIndex = itemsMock.createItem.mock.calls.findIndex(
      ([contentType]) => contentType === ContentType.KeySystemRootKey,
    )

    const vaultListingCallIndex = itemsMock.createItem.mock.calls.findIndex(
      ([contentType]) => contentType === ContentType.VaultListing,
    )

    expect(keySystemRootKeyCallIndex).toBeLessThan(vaultListingCallIndex)
  })
})

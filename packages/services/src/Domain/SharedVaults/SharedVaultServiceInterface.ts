import { ClientDisplayableError } from '@standardnotes/responses'
import {
  DecryptedItemInterface,
  TrustedContactInterface,
  SharedVaultListingInterface,
  VaultListingInterface,
  KeySystemRootKeyStorageMode,
  EmojiString,
  IconType,
} from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { SharedVaultServiceEvent, SharedVaultServiceEventPayload } from './SharedVaultServiceEvent'

export interface SharedVaultServiceInterface
  extends AbstractService<SharedVaultServiceEvent, SharedVaultServiceEventPayload> {
  createSharedVault(dto: {
    name: string
    description?: string
    iconString: IconType | EmojiString
    userInputtedPassword: string | undefined
    storagePreference?: KeySystemRootKeyStorageMode
  }): Promise<VaultListingInterface | ClientDisplayableError>
  deleteSharedVault(sharedVault: SharedVaultListingInterface): Promise<ClientDisplayableError | void>
  convertVaultToSharedVault(vault: VaultListingInterface): Promise<SharedVaultListingInterface | ClientDisplayableError>

  getItemLastEditedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined
  getItemSharedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined
}

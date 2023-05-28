import { TrustedContactInterface } from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { ContactServerHash, VaultInviteServerHash, VaultUserServerHash } from '@standardnotes/responses'

export enum ContactServiceEvent {
  ReceivedContactRequests = 'ReceivedContactRequests',
  ContactsChanged = 'ContactsChanged',
}

export interface ContactServiceInterface extends AbstractService<ContactServiceEvent> {
  isCollaborationEnabled(): boolean
  enableCollaboration(): Promise<void>
  getCollaborationID(): string
  getCollaborationIDFromInvite(invite: VaultInviteServerHash): string
  addTrustedContactFromCollaborationID(
    collaborationID: string,
    name?: string,
  ): Promise<TrustedContactInterface | undefined>
  getCollaborationIDForTrustedContact(contact: TrustedContactInterface): string

  getServerContacts(): ContactServerHash[]
  trustServerContact(serverContact: ContactServerHash, name?: string): Promise<void>

  createTrustedContact(params: {
    name: string
    publicKey: string
    contactUuid: string
  }): Promise<TrustedContactInterface | undefined>
  editTrustedContact(contact: TrustedContactInterface, params: { name: string; collaborationID: string }): Promise<void>
  deleteContact(contact: TrustedContactInterface): Promise<void>

  getAllContacts(): TrustedContactInterface[]
  getContactItem(serverUuid: string): TrustedContactInterface | undefined
  findTrustedContact(userUuid: string): TrustedContactInterface | undefined
  findTrustedContactForServerUser(user: VaultUserServerHash): TrustedContactInterface | undefined
  findTrustedContactForInvite(invite: VaultInviteServerHash): TrustedContactInterface | undefined

  refreshAllContactsAfterPublicKeyChange(): Promise<void>
}

import { TrustedContactContentSpecialized, TrustedContactInterface } from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { SharedVaultInviteServerHash, SharedVaultUserServerHash } from '@standardnotes/responses'

export enum ContactServiceEvent {
  ContactsChanged = 'ContactsChanged',
}

export interface ContactServiceInterface extends AbstractService<ContactServiceEvent> {
  isCollaborationEnabled(): boolean
  enableCollaboration(): Promise<void>
  getCollaborationID(): string
  getCollaborationIDFromInvite(invite: SharedVaultInviteServerHash): string
  addTrustedContactFromCollaborationID(
    collaborationID: string,
    name?: string,
  ): Promise<TrustedContactInterface | undefined>
  getCollaborationIDForTrustedContact(contact: TrustedContactInterface): string

  createOrEditTrustedContact(params: {
    contactUuid: string
    name?: string
    publicKey: string
    signingPublicKey: string
  }): Promise<TrustedContactInterface | undefined>
  createOrUpdateTrustedContactFromContactShare(data: TrustedContactContentSpecialized): Promise<TrustedContactInterface>
  editTrustedContactFromCollaborationID(
    contact: TrustedContactInterface,
    params: { name: string; collaborationID: string },
  ): Promise<TrustedContactInterface>
  deleteContact(contact: TrustedContactInterface): Promise<void>

  getAllContacts(): TrustedContactInterface[]
  findTrustedContact(userUuid: string): TrustedContactInterface | undefined
  findTrustedContactForServerUser(user: SharedVaultUserServerHash): TrustedContactInterface | undefined
  findTrustedContactForInvite(invite: SharedVaultInviteServerHash): TrustedContactInterface | undefined
}

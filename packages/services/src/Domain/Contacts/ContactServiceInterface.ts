import { TrustedContactInterface } from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { ContactServerHash, GroupInviteServerHash } from '@standardnotes/responses'

export enum ContactServiceEvent {
  ReceivedContactRequests = 'ReceivedContactRequests',
}

export interface ContactServiceInterface extends AbstractService<ContactServiceEvent> {
  isCollaborationEnabled(): boolean

  enableCollaboration(): Promise<void>

  getCollaborationID(): string

  getCollaborationIDFromInvite(invite: GroupInviteServerHash): string

  addTrustedContactFromCollaborationID(
    collaborationID: string,
    name?: string,
  ): Promise<TrustedContactInterface | undefined>

  getServerContacts(): ContactServerHash[]

  trustServerContact(serverContact: ContactServerHash, name?: string): Promise<void>

  createTrustedContact(params: {
    name: string
    publicKey: string
    contactUuid: string
  }): Promise<TrustedContactInterface | undefined>

  getAllContacts(): TrustedContactInterface[]

  findTrustedContact(userUuid: string): TrustedContactInterface | undefined

  refreshAllContactsAfterPublicKeyChange(): Promise<void>
}

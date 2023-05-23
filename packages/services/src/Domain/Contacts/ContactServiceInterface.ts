import { TrustedContactInterface } from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { ContactServerHash } from '@standardnotes/responses'

export enum ContactServiceEvent {
  ReceivedContactRequests = 'ReceivedContactRequests',
}

export interface ContactServiceInterface extends AbstractService<ContactServiceEvent> {
  getCollaborationID(): string

  addTrustedContactFromCollaborationID(
    collaborationID: string,
    name?: string,
  ): Promise<TrustedContactInterface | undefined>

  getPendingContactRequests(): ContactServerHash[]

  trustServerContact(serverContact: ContactServerHash, name?: string): Promise<void>

  createTrustedContact(params: {
    name: string
    publicKey: string
    contactUuid: string
  }): Promise<TrustedContactInterface | undefined>

  getAllContacts(): TrustedContactInterface[]

  findTrustedContact(userUuid: string): TrustedContactInterface | undefined
}

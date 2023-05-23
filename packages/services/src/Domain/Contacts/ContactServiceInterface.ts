import { TrustedContactInterface } from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { ContactServerHash } from '@standardnotes/responses'

export enum ContactServiceEvent {
  ReceivedContactRequests = 'ReceivedContactRequests',
}

export interface ContactServiceInterface extends AbstractService<ContactServiceEvent> {
  createTrustedContact(params: {
    name: string
    publicKey: string
    contactUuid: string
  }): Promise<TrustedContactInterface | undefined>

  trustServerContact(serverContact: ContactServerHash, name?: string): Promise<void>

  getAllContacts(): TrustedContactInterface[]

  findTrustedContact(userUuid: string): TrustedContactInterface | undefined
}

import { TrustedContactInterface } from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'

export enum ContactServiceEvent {
  ReceivedContactRequests = 'ReceivedContactRequests',
}

export interface ContactServiceInterface extends AbstractService<ContactServiceEvent> {
  createTrustedContact(params: {
    name: string
    publicKey: string
    userUuid: string
  }): Promise<TrustedContactInterface | undefined>

  findTrustedContact(userUuid: string): TrustedContactInterface | undefined
}

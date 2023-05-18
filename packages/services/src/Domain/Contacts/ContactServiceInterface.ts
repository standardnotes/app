import { ContactInterface } from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'

export interface ContactServiceInterface extends AbstractService {
  createContact(params: {
    name: string
    publicKey: string
    userUuid: string
    trusted: boolean
  }): Promise<ContactInterface>

  findContact(userUuid: string): ContactInterface | undefined
}

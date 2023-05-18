import { ContactInterface } from '@standardnotes/models'

export interface ContactServiceInterface {
  createContact(params: {
    name: string
    publicKey: string
    userUuid: string
    trusted: boolean
  }): Promise<ContactInterface>

  findContact(userUuid: string): ContactInterface | undefined
}

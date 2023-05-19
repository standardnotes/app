import { HttpResponse, ContactServerHash } from '@standardnotes/responses'

export type CreateContactResponse = {
  contact: ContactServerHash
}

export interface ContactServerInterface {
  createContact(params: { contactUuid: string; contactPublicKey: string }): Promise<HttpResponse<CreateContactResponse>>

  deleteContact(params: { uuid: string }): Promise<HttpResponse<boolean>>
}

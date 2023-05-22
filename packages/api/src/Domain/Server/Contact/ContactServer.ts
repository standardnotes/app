import { HttpResponse } from '@standardnotes/responses'
import { HttpServiceInterface } from '../../Http'
import { CreateContactResponse, ContactServerInterface } from './ContactServerInterface'
import { ContactPaths } from './Paths'

export class ContactServer implements ContactServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  createContact(params: {
    contactUuid: string
    contactPublicKey: string
  }): Promise<HttpResponse<CreateContactResponse>> {
    return this.httpService.post(ContactPaths.createContact, {
      contact_uuid: params.contactUuid,
      contact_public_key: params.contactPublicKey,
    })
  }

  deleteContact(params: { uuid: string }): Promise<HttpResponse<boolean>> {
    return this.httpService.delete(ContactPaths.deleteContact(params.uuid))
  }
}

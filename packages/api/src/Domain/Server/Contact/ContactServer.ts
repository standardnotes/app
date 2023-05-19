import { HttpResponse } from '@standardnotes/responses'
import { HttpServiceInterface } from '../../Http'
import { CreateContactResponse, ContactServerInterface } from './ContactServerInterface'
import { SharingPaths } from './Paths'

export class ContactServer implements ContactServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  createContact(params: {
    contactUuid: string
    contactPublicKey: string
  }): Promise<HttpResponse<CreateContactResponse>> {
    return this.httpService.post(SharingPaths.createContact, {
      contact_uuid: params.contactUuid,
      contact_public_key: params.contactPublicKey,
    })
  }

  deleteContact(params: { uuid: string }): Promise<HttpResponse<boolean>> {
    return this.httpService.delete(SharingPaths.deleteContact(params.uuid))
  }
}

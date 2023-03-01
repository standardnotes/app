import { GetSingleItemResponse, HttpResponse } from '@standardnotes/responses'

export interface ItemsServerInterface {
  getSingleItem(itemUuid: string): Promise<HttpResponse<GetSingleItemResponse>>
}

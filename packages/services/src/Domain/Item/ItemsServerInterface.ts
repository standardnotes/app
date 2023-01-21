import { GetSingleItemResponse } from '@standardnotes/responses'

export interface ItemsServerInterface {
  getSingleItem(itemUuid: string): Promise<GetSingleItemResponse>
}

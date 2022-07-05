import { Uuid } from '@standardnotes/common'
import { GetSingleItemResponse } from '@standardnotes/responses'

export interface ItemsServerInterface {
  getSingleItem(itemUuid: Uuid): Promise<GetSingleItemResponse>
}

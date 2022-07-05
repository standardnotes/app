import { DeletedPayloadInterface } from './../../Payload/Interfaces/DeletedPayload'
import { ItemInterface } from './ItemInterface'

export interface DeletedItemInterface extends ItemInterface<DeletedPayloadInterface> {
  readonly deleted: true
  readonly content: undefined
}

import { Result } from '@standardnotes/domain-core'
import {
  EncryptedPayloadInterface,
  DeletedPayloadInterface,
  PayloadSource,
  DeletedPayload,
  EncryptedPayload,
  FilteredServerItem,
} from '@standardnotes/models'

export function CreatePayloadFromRawServerItem(
  rawItem: FilteredServerItem,
  source: PayloadSource,
): Result<EncryptedPayloadInterface | DeletedPayloadInterface> {
  if (rawItem.deleted) {
    return Result.ok(new DeletedPayload({ ...rawItem, content: undefined, deleted: true }, source))
  } else if (rawItem.content != undefined) {
    try {
      return Result.ok(
        new EncryptedPayload(
          {
            ...rawItem,
            items_key_id: rawItem.items_key_id,
            content: rawItem.content,
            deleted: false,
            errorDecrypting: false,
            waitingForKey: false,
          },
          source,
        ),
      )
    } catch (error) {
      return Result.fail(JSON.stringify(error))
    }
  }
  return Result.fail('Unhandled case in createPayloadFromRawItem')
}

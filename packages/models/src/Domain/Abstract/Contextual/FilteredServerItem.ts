import { ServerItemResponse } from '@standardnotes/responses'
import { isCorruptTransferPayload, isEncryptedTransferPayload } from '../TransferPayload'

export interface FilteredServerItem extends ServerItemResponse {
  __passed_filter__: true
}

function CreateFilteredServerItem(item: ServerItemResponse): FilteredServerItem {
  return {
    ...item,
    __passed_filter__: true,
  }
}

export function FilterDisallowedRemotePayloadsAndMap(payloads: ServerItemResponse[]): {
  filtered: FilteredServerItem[]
  disallowed: ServerItemResponse[]
} {
  const filtered = []
  const disallowed = []
  for (const payload of payloads) {
    const result = checkRemotePayloadAllowed(payload)
    if (result.allowed === undefined) {
      disallowed.push(payload)
    } else {
      filtered.push(CreateFilteredServerItem(result.allowed))
    }
  }

  return {
    filtered,
    disallowed,
  }
}

export function checkRemotePayloadAllowed(payload: ServerItemResponse): {
  allowed?: ServerItemResponse
  disallowed?: ServerItemResponse
} {
  if (isCorruptTransferPayload(payload)) {
    return { disallowed: payload }
  }

  if (isEncryptedTransferPayload(payload) || payload.content == undefined) {
    return { allowed: payload }
  } else {
    return { disallowed: payload }
  }
}

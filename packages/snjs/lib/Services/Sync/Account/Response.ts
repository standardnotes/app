import {
  ApiEndpointParam,
  ConflictParams,
  ConflictType,
  Error,
  RawSyncResponse,
  ServerItemResponse,
} from '@standardnotes/responses'
import {
  FilterDisallowedRemotePayloadsAndMap,
  CreateServerSyncSavedPayload,
  ServerSyncSavedContextualPayload,
  FilteredServerItem,
} from '@standardnotes/models'
import { deepFreeze, isNullOrUndefined } from '@standardnotes/utils'

export class ServerSyncResponse {
  public readonly rawResponse: RawSyncResponse
  public readonly savedPayloads: ServerSyncSavedContextualPayload[]
  public readonly retrievedPayloads: FilteredServerItem[]
  public readonly uuidConflictPayloads: FilteredServerItem[]
  public readonly dataConflictPayloads: FilteredServerItem[]
  public readonly rejectedPayloads: FilteredServerItem[]

  constructor(rawResponse: RawSyncResponse) {
    this.rawResponse = rawResponse

    this.savedPayloads = FilterDisallowedRemotePayloadsAndMap(rawResponse.data?.saved_items || []).map((rawItem) => {
      return CreateServerSyncSavedPayload(rawItem)
    })

    this.retrievedPayloads = FilterDisallowedRemotePayloadsAndMap(rawResponse.data?.retrieved_items || [])

    this.dataConflictPayloads = FilterDisallowedRemotePayloadsAndMap(this.rawDataConflictItems)

    this.uuidConflictPayloads = FilterDisallowedRemotePayloadsAndMap(this.rawUuidConflictItems)

    this.rejectedPayloads = FilterDisallowedRemotePayloadsAndMap(this.rawRejectedPayloads)

    deepFreeze(this)
  }

  public get error(): Error | undefined {
    return this.rawResponse.error || this.rawResponse.data?.error
  }

  public get status(): number {
    return this.rawResponse.status as number
  }

  public get lastSyncToken(): string | undefined {
    return this.rawResponse.data?.[ApiEndpointParam.LastSyncToken]
  }

  public get paginationToken(): string | undefined {
    return this.rawResponse.data?.[ApiEndpointParam.PaginationToken]
  }

  public get numberOfItemsInvolved(): number {
    return this.allFullyFormedPayloads.length
  }

  private get allFullyFormedPayloads(): FilteredServerItem[] {
    return [
      ...this.retrievedPayloads,
      ...this.dataConflictPayloads,
      ...this.uuidConflictPayloads,
      ...this.rejectedPayloads,
    ]
  }

  private get rawUuidConflictItems(): ServerItemResponse[] {
    return this.rawConflictObjects
      .filter((conflict) => {
        return conflict.type === ConflictType.UuidConflict
      })
      .map((conflict) => {
        return conflict.unsaved_item || (conflict.item as ServerItemResponse)
      })
  }

  private get rawDataConflictItems(): ServerItemResponse[] {
    return this.rawConflictObjects
      .filter((conflict) => {
        return conflict.type === ConflictType.ConflictingData
      })
      .map((conflict) => {
        return conflict.server_item || (conflict.item as ServerItemResponse)
      })
  }

  private get rawRejectedPayloads(): ServerItemResponse[] {
    return this.rawConflictObjects
      .filter((conflict) => {
        return (
          conflict.type === ConflictType.ContentTypeError ||
          conflict.type === ConflictType.ContentError ||
          conflict.type === ConflictType.ReadOnlyError
        )
      })
      .map((conflict) => {
        return conflict.unsaved_item as ServerItemResponse
      })
  }

  private get rawConflictObjects(): ConflictParams[] {
    const conflicts = this.rawResponse.data?.conflicts || []
    const legacyConflicts = this.rawResponse.data?.unsaved || []
    return conflicts.concat(legacyConflicts)
  }

  public get hasError(): boolean {
    return !isNullOrUndefined(this.rawResponse.error)
  }
}

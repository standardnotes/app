import {
  ApiEndpointParam,
  ConflictParams,
  ConflictType,
  GroupUserServerHash,
  HttpError,
  HttpResponse,
  isErrorResponse,
  RawSyncResponse,
  ServerItemResponse,
} from '@standardnotes/responses'
import {
  FilterDisallowedRemotePayloadsAndMap,
  CreateServerSyncSavedPayload,
  ServerSyncSavedContextualPayload,
  FilteredServerItem,
} from '@standardnotes/models'
import { deepFreeze } from '@standardnotes/utils'

export class ServerSyncResponse {
  public readonly savedPayloads: ServerSyncSavedContextualPayload[]
  public readonly retrievedPayloads: FilteredServerItem[]
  public readonly uuidConflictPayloads: FilteredServerItem[]
  public readonly dataConflictPayloads: FilteredServerItem[]
  public readonly rejectedPayloads: FilteredServerItem[]
  readonly groupKeys: GroupUserServerHash[]

  private successResponseData: RawSyncResponse | undefined

  constructor(public rawResponse: HttpResponse<RawSyncResponse>) {
    this.rawResponse = rawResponse

    if (!isErrorResponse(rawResponse)) {
      this.successResponseData = rawResponse.data
    }

    this.savedPayloads = FilterDisallowedRemotePayloadsAndMap(this.successResponseData?.saved_items || []).map(
      (rawItem) => {
        return CreateServerSyncSavedPayload(rawItem)
      },
    )

    this.retrievedPayloads = FilterDisallowedRemotePayloadsAndMap(this.successResponseData?.retrieved_items || [])

    this.dataConflictPayloads = FilterDisallowedRemotePayloadsAndMap(this.rawDataConflictItems)

    this.uuidConflictPayloads = FilterDisallowedRemotePayloadsAndMap(this.rawUuidConflictItems)

    this.rejectedPayloads = FilterDisallowedRemotePayloadsAndMap(this.rawRejectedPayloads)

    this.groupKeys = this.successResponseData?.group_keys || []

    deepFreeze(this)
  }

  public get error(): HttpError | undefined {
    return isErrorResponse(this.rawResponse) ? this.rawResponse.data?.error : undefined
  }

  public get status(): number {
    return this.rawResponse.status as number
  }

  public get lastSyncToken(): string | undefined {
    return this.successResponseData?.[ApiEndpointParam.LastSyncToken]
  }

  public get paginationToken(): string | undefined {
    return this.successResponseData?.[ApiEndpointParam.PaginationToken]
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
        return conflict.unsaved_item || conflict.item!
      })
  }

  private get rawDataConflictItems(): ServerItemResponse[] {
    return this.rawConflictObjects
      .filter((conflict) => {
        return conflict.type === ConflictType.ConflictingData
      })
      .map((conflict) => {
        return conflict.server_item || conflict.item!
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
        return conflict.unsaved_item!
      })
  }

  private get rawConflictObjects(): ConflictParams[] {
    const conflicts = this.successResponseData?.conflicts || []
    const legacyConflicts = this.successResponseData?.unsaved || []
    return conflicts.concat(legacyConflicts)
  }

  public get hasError(): boolean {
    return this.error != undefined
  }
}

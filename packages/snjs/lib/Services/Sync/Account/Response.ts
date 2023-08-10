import {
  ApiEndpointParam,
  ConflictParams,
  SharedVaultInviteServerHash,
  SharedVaultServerHash,
  HttpError,
  HttpResponse,
  isErrorResponse,
  RawSyncResponse,
  NotificationServerHash,
  AsymmetricMessageServerHash,
  getErrorFromErrorResponse,
  ConflictType,
  ServerItemResponse,
} from '@standardnotes/responses'
import {
  FilterDisallowedRemotePayloadsAndMap,
  CreateServerSyncSavedPayload,
  ServerSyncSavedContextualPayload,
  FilteredServerItem,
  TrustedConflictParams,
} from '@standardnotes/models'
import { deepFreeze } from '@standardnotes/utils'
import { TrustedServerConflictMap } from './ServerConflictMap'

export class ServerSyncResponse {
  readonly savedPayloads: ServerSyncSavedContextualPayload[]
  readonly retrievedPayloads: FilteredServerItem[]
  readonly conflicts: TrustedServerConflictMap

  readonly asymmetricMessages: AsymmetricMessageServerHash[]
  readonly vaults: SharedVaultServerHash[]
  readonly vaultInvites: SharedVaultInviteServerHash[]
  readonly userEvents: NotificationServerHash[]

  private readonly rawConflictObjects: ConflictParams[]

  private successResponseData: RawSyncResponse | undefined

  constructor(public rawResponse: HttpResponse<RawSyncResponse>) {
    if (!isErrorResponse(rawResponse)) {
      this.successResponseData = rawResponse.data
    }

    const conflicts = this.successResponseData?.conflicts || []
    const legacyConflicts = this.successResponseData?.unsaved || []
    this.rawConflictObjects = conflicts.concat(legacyConflicts)

    const disallowedPayloads = []

    const savedItemsFilteringResult = FilterDisallowedRemotePayloadsAndMap(this.successResponseData?.saved_items || [])
    this.savedPayloads = savedItemsFilteringResult.filtered.map((rawItem) => {
      return CreateServerSyncSavedPayload(rawItem)
    })
    disallowedPayloads.push(...savedItemsFilteringResult.disallowed)

    const retrievedItemsFilteringResult = FilterDisallowedRemotePayloadsAndMap(
      this.successResponseData?.retrieved_items || [],
    )
    this.retrievedPayloads = retrievedItemsFilteringResult.filtered
    disallowedPayloads.push(...retrievedItemsFilteringResult.disallowed)

    this.conflicts = this.filterConflictsAndDisallowedPayloads(disallowedPayloads)

    this.vaults = this.successResponseData?.shared_vaults || []

    this.vaultInvites = this.successResponseData?.shared_vault_invites || []

    this.asymmetricMessages = this.successResponseData?.messages || []

    this.userEvents = this.successResponseData?.notifications || []

    deepFreeze(this)
  }

  private filterConflictsAndDisallowedPayloads(disallowedPayloads: ServerItemResponse[]): TrustedServerConflictMap {
    const conflicts = this.rawConflictObjects
    const trustedConflicts: TrustedServerConflictMap = {}

    trustedConflicts[ConflictType.InvalidServerItem] = []
    const invalidServerConflictsArray = trustedConflicts[ConflictType.InvalidServerItem]

    for (const payload of disallowedPayloads) {
      invalidServerConflictsArray.push(<TrustedConflictParams>{
        type: ConflictType.InvalidServerItem,
        server_item: payload,
      })
    }

    for (const conflict of conflicts) {
      let serverItem: FilteredServerItem | undefined
      let unsavedItem: FilteredServerItem | undefined

      if (conflict.unsaved_item) {
        const unsavedItemFilteringResult = FilterDisallowedRemotePayloadsAndMap([conflict.unsaved_item])
        if (unsavedItemFilteringResult.filtered.length === 1) {
          unsavedItem = unsavedItemFilteringResult.filtered[0]
        }
        if (unsavedItemFilteringResult.disallowed.length === 1) {
          invalidServerConflictsArray.push(<TrustedConflictParams>{
            type: ConflictType.InvalidServerItem,
            unsaved_item: unsavedItemFilteringResult.disallowed[0],
          })
        }
      }

      if (conflict.server_item) {
        const serverItemFilteringResult = FilterDisallowedRemotePayloadsAndMap([conflict.server_item])
        if (serverItemFilteringResult.filtered.length === 1) {
          serverItem = serverItemFilteringResult.filtered[0]
        }
        if (serverItemFilteringResult.disallowed.length === 1) {
          invalidServerConflictsArray.push(<TrustedConflictParams>{
            type: ConflictType.InvalidServerItem,
            server_item: serverItemFilteringResult.disallowed[0],
          })
        }
      }

      if (!trustedConflicts[conflict.type]) {
        trustedConflicts[conflict.type] = []
      }

      const conflictArray = trustedConflicts[conflict.type]
      if (conflictArray) {
        const entry: TrustedConflictParams = <TrustedConflictParams>{
          type: conflict.type,
          server_item: serverItem,
          unsaved_item: unsavedItem,
        }
        conflictArray.push(entry)
      }
    }

    return trustedConflicts
  }

  public get error(): HttpError | undefined {
    if (isErrorResponse(this.rawResponse)) {
      return getErrorFromErrorResponse(this.rawResponse)
    } else {
      return undefined
    }
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
    const allPayloads = [...this.retrievedPayloads, ...this.rawConflictObjects]

    return allPayloads.length
  }

  public get hasError(): boolean {
    return isErrorResponse(this.rawResponse)
  }
}

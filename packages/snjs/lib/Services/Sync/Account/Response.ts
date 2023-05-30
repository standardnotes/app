import {
  ApiEndpointParam,
  ConflictParams,
  ContactServerHash,
  VaultInviteServerHash,
  VaultServerHash,
  HttpError,
  HttpResponse,
  isErrorResponse,
  RawSyncResponse,
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

  readonly contacts: ContactServerHash[]
  readonly vaults: VaultServerHash[]
  readonly vaultInvites: VaultInviteServerHash[]

  private readonly rawConflictObjects: ConflictParams[]

  private successResponseData: RawSyncResponse | undefined

  constructor(public rawResponse: HttpResponse<RawSyncResponse>) {
    this.rawResponse = rawResponse

    const conflicts = this.successResponseData?.conflicts || []
    const legacyConflicts = this.successResponseData?.unsaved || []
    this.rawConflictObjects = conflicts.concat(legacyConflicts)

    if (!isErrorResponse(rawResponse)) {
      this.successResponseData = rawResponse.data
    }

    this.savedPayloads = FilterDisallowedRemotePayloadsAndMap(this.successResponseData?.saved_items || []).map(
      (rawItem) => {
        return CreateServerSyncSavedPayload(rawItem)
      },
    )

    this.retrievedPayloads = FilterDisallowedRemotePayloadsAndMap(this.successResponseData?.retrieved_items || [])

    this.conflicts = this.filterConflicts()

    this.vaults = this.successResponseData?.vaults || []

    this.vaultInvites = this.successResponseData?.vault_invites || []

    this.contacts = this.successResponseData?.contacts || []

    deepFreeze(this)
  }

  private filterConflicts(): TrustedServerConflictMap {
    const conflicts = this.rawConflictObjects
    const trustedConflicts: TrustedServerConflictMap = {}

    for (const conflict of conflicts) {
      let serverItem: FilteredServerItem | undefined
      let unsavedItem: FilteredServerItem | undefined

      if (conflict.unsaved_item) {
        unsavedItem = FilterDisallowedRemotePayloadsAndMap([conflict.unsaved_item])[0]
      }

      if (conflict.server_item) {
        serverItem = FilterDisallowedRemotePayloadsAndMap([conflict.server_item])[0]
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
    const allPayloads = [...this.retrievedPayloads, ...this.rawConflictObjects]

    return allPayloads.length
  }

  public get hasError(): boolean {
    return this.error != undefined
  }
}

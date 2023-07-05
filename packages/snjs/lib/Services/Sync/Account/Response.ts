import {
  ApiEndpointParam,
  ConflictParams,
  SharedVaultInviteServerHash,
  SharedVaultServerHash,
  HttpError,
  HttpResponse,
  isErrorResponse,
  RawSyncResponse,
  UserEventServerHash,
  AsymmetricMessageServerHash,
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
  readonly userEvents: UserEventServerHash[]

  private readonly rawConflictObjects: ConflictParams[]

  private successResponseData: RawSyncResponse | undefined

  constructor(public rawResponse: HttpResponse<RawSyncResponse>) {
    if (!isErrorResponse(rawResponse)) {
      this.successResponseData = rawResponse.data
    }

    const conflicts = this.successResponseData?.conflicts || []
    const legacyConflicts = this.successResponseData?.unsaved || []
    this.rawConflictObjects = conflicts.concat(legacyConflicts)

    this.savedPayloads = FilterDisallowedRemotePayloadsAndMap(this.successResponseData?.saved_items || []).map(
      (rawItem) => {
        return CreateServerSyncSavedPayload(rawItem)
      },
    )

    this.retrievedPayloads = FilterDisallowedRemotePayloadsAndMap(this.successResponseData?.retrieved_items || [])

    this.conflicts = this.filterConflicts()

    this.vaults = this.successResponseData?.shared_vaults || []

    this.vaultInvites = this.successResponseData?.shared_vault_invites || []

    this.asymmetricMessages = this.successResponseData?.asymmetric_messages || []

    this.userEvents = this.successResponseData?.user_events || []

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
    if (isErrorResponse(this.rawResponse)) {
      const error = this.rawResponse.data?.error
      if (error) {
        return error
      } else {
        return {
          message: 'Unknown error',
        }
      }
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

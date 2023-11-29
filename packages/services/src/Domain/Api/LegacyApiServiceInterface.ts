import { FilesApiInterface } from '@standardnotes/files'
import { AbstractService } from '../Service/AbstractService'
import { ApiServiceEvent } from './ApiServiceEvent'
import { ApiServiceEventData } from './ApiServiceEventData'
import { SNFeatureRepo, ServerSyncPushContextualPayload } from '@standardnotes/models'
import { ClientDisplayableError, HttpRequest, HttpResponse } from '@standardnotes/responses'
import { AnyFeatureDescription } from '@standardnotes/features'

export interface LegacyApiServiceInterface
  extends AbstractService<ApiServiceEvent, ApiServiceEventData>,
    FilesApiInterface {
  setHost(host: string): Promise<void>
  getHost(): string

  downloadOfflineFeaturesFromRepo(dto: {
    repo: SNFeatureRepo
  }): Promise<{ features: AnyFeatureDescription[]; roles: string[] } | ClientDisplayableError>

  downloadFeatureUrl(url: string): Promise<HttpResponse>

  getSyncHttpRequest(
    payloads: ServerSyncPushContextualPayload[],
    lastSyncToken: string | undefined,
    paginationToken: string | undefined,
    limit: number,
    sharedVaultUuids?: string[],
  ): HttpRequest

  getNewSubscriptionToken(): Promise<string | undefined>
}

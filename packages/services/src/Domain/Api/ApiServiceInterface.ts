import { FilesApiInterface } from '@standardnotes/files'
import { AbstractService } from '../Service/AbstractService'
import { ApiServiceEvent } from './ApiServiceEvent'
import { ApiServiceEventData } from './ApiServiceEventData'
import { SNFeatureRepo } from '@standardnotes/models'
import { FeatureDescription } from '@standardnotes/features'
import { ClientDisplayableError, HttpResponse } from '@standardnotes/responses'

export interface ApiServiceInterface extends AbstractService<ApiServiceEvent, ApiServiceEventData>, FilesApiInterface {
  isThirdPartyHostUsed(): boolean

  downloadOfflineFeaturesFromRepo(
    repo: SNFeatureRepo,
  ): Promise<{ features: FeatureDescription[]; roles: string[] } | ClientDisplayableError>

  downloadFeatureUrl(url: string): Promise<HttpResponse>
}

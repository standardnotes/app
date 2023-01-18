import { HistoryEntry } from '@standardnotes/models'
import { UseCaseInterface } from '@standardnotes/domain-core'

import { RevisionMetadata } from '../Revision/RevisionMetadata'

export interface UseCaseContainerInterface {
  get signInWithRecoveryCodes(): UseCaseInterface<void>
  get getRecoveryCodes(): UseCaseInterface<string>
  get addAuthenticator(): UseCaseInterface<void>
  get listAuthenticators(): UseCaseInterface<Array<{ id: string; name: string }>>
  get deleteAuthenticator(): UseCaseInterface<void>
  get verifyAuthenticator(): UseCaseInterface<void>
  get listRevisions(): UseCaseInterface<Array<RevisionMetadata>>
  get getRevision(): UseCaseInterface<HistoryEntry>
  get deleteRevision(): UseCaseInterface<void>
}

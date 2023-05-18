import { Either } from '@standardnotes/common'
import { FilesApiInterface } from '@standardnotes/files'
import { Session } from '@standardnotes/domain-core'
import { Role } from '@standardnotes/security'

import { AbstractService } from '../Service/AbstractService'

/* istanbul ignore file */

export enum ApiServiceEvent {
  MetaReceived = 'MetaReceived',
  SessionRefreshed = 'SessionRefreshed',
}

export type MetaReceivedData = {
  userUuid: string
  userRoles: Role[]
  userPublicKey?: string
}

export type SessionRefreshedData = {
  session: Session
}

export type ApiServiceEventData = Either<MetaReceivedData, SessionRefreshedData>

export interface ApiServiceInterface extends AbstractService<ApiServiceEvent, ApiServiceEventData>, FilesApiInterface {}

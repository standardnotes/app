import { Either, Uuid } from '@standardnotes/common'
import { Role } from '@standardnotes/auth'
import { FilesApiInterface } from '@standardnotes/files'
import { Session } from '@standardnotes/domain-core'

import { AbstractService } from '../Service/AbstractService'

/* istanbul ignore file */

export enum ApiServiceEvent {
  MetaReceived = 'MetaReceived',
  SessionRefreshed = 'SessionRefreshed',
}

export type MetaReceivedData = {
  userUuid: Uuid
  userRoles: Role[]
}

export type SessionRefreshedData = {
  session: Session
}

export type ApiServiceEventData = Either<MetaReceivedData, SessionRefreshedData>

export interface ApiServiceInterface extends AbstractService<ApiServiceEvent, ApiServiceEventData>, FilesApiInterface {}

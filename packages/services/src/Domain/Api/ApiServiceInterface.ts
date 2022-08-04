import { AbstractService } from '../Service/AbstractService'
import { Uuid } from '@standardnotes/common'
import { Role } from '@standardnotes/auth'
import { FilesApiInterface } from '@standardnotes/files'

/* istanbul ignore file */

export enum ApiServiceEvent {
  MetaReceived = 'MetaReceived',
}

export type MetaReceivedData = {
  userUuid: Uuid
  userRoles: Role[]
}

export interface ApiServiceInterface
  extends AbstractService<ApiServiceEvent.MetaReceived, MetaReceivedData>,
    FilesApiInterface {}

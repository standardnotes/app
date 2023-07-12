import { Either } from '@standardnotes/common'
import { SessionRefreshedData } from './SessionRefreshedData'
import { MetaReceivedData } from './MetaReceivedData'

export type ApiServiceEventData = Either<MetaReceivedData, SessionRefreshedData>

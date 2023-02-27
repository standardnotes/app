import { DeprecatedHttpResponse } from '../Http/DeprecatedHttpResponse'
import { RawSyncData } from './RawSyncData'

export type RawSyncResponse = DeprecatedHttpResponse & { data: RawSyncData }

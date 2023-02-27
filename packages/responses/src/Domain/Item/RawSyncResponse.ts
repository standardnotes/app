import { HttpResponse } from '../Http/HttpResponse'
import { RawSyncData } from './RawSyncData'

export type RawSyncResponse = HttpResponse & { data: RawSyncData }

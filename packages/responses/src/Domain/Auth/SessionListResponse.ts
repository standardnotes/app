import { HttpResponse } from '../Http/HttpResponse'
import { SessionListEntry } from './SessionListEntry'

export type SessionListResponse = HttpResponse & { data: SessionListEntry[] }

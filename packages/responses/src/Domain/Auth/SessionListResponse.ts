import { HttpSuccessResponse } from './../Http/HttpResponse'
import { SessionListEntry } from './SessionListEntry'

export type SessionListResponse = HttpSuccessResponse<SessionListEntry[]>

import { DeprecatedHttpResponse } from '../Http/DeprecatedHttpResponse'
import { SessionListEntry } from './SessionListEntry'

export type SessionListResponse = DeprecatedHttpResponse & { data: SessionListEntry[] }

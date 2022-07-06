import { HttpResponse } from '../Http/HttpResponse'
import { RevisionListEntry } from './RevisionListEntry'

export type RevisionListResponse = HttpResponse & { data: RevisionListEntry[] }

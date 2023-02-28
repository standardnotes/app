import { HttpSuccessResponse } from '../Http/HttpResponse'
import { SessionRenewalData } from './SessionRenewalData'

export type SessionRenewalResponse = HttpSuccessResponse<SessionRenewalData>

import { HttpSuccessResponse } from '../Http/HttpResponse'
import { IntegrityPayload } from './IntegrityPayload'

export type CheckIntegrityResponse = HttpSuccessResponse<{
  mismatches: IntegrityPayload[]
}>

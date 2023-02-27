import { HttpResponse } from '../Http/HttpResponse'
import { IntegrityPayload } from './IntegrityPayload'

export type CheckIntegrityResponse = HttpResponse & {
  data: {
    mismatches: IntegrityPayload[]
  }
}

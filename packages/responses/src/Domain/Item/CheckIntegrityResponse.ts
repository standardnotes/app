import { MinimalHttpResponse } from '../Http/MinimalHttpResponses'
import { IntegrityPayload } from './IntegrityPayload'

export type CheckIntegrityResponse = MinimalHttpResponse & {
  data: {
    mismatches: IntegrityPayload[]
  }
}

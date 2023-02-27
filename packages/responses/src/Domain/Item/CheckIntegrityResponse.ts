import { DeprecatedMinimalHttpResponse } from '../Http/DeprecatedMinimalHttpResponses'
import { IntegrityPayload } from './IntegrityPayload'

export type CheckIntegrityResponse = DeprecatedMinimalHttpResponse & {
  data: {
    mismatches: IntegrityPayload[]
  }
}

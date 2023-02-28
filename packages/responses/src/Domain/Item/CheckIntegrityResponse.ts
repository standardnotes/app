import { IntegrityPayload } from './IntegrityPayload'

export type CheckIntegrityResponse = {
  mismatches: IntegrityPayload[]
}

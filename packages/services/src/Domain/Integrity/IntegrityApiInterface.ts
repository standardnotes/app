import { CheckIntegrityResponse, IntegrityPayload } from '@standardnotes/responses'

export interface IntegrityApiInterface {
  checkIntegrity(integrityPayloads: IntegrityPayload[]): Promise<CheckIntegrityResponse>
}

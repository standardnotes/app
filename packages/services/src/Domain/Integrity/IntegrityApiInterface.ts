import { CheckIntegrityResponse, IntegrityPayload, HttpResponse } from '@standardnotes/responses'

export interface IntegrityApiInterface {
  checkIntegrity(integrityPayloads: IntegrityPayload[]): Promise<HttpResponse<CheckIntegrityResponse>>
}

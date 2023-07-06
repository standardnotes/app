import { AsymmetricMessageServerHash, ClientDisplayableError } from '@standardnotes/responses'

export interface AsymmetricMessageServiceInterface {
  getOutboundMessages(): Promise<AsymmetricMessageServerHash[] | ClientDisplayableError>
  getInboundMessages(): Promise<AsymmetricMessageServerHash[] | ClientDisplayableError>
  downloadAndProcessInboundMessages(): Promise<void>
}

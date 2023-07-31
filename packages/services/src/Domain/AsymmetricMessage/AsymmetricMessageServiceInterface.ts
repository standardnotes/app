import { Result } from '@standardnotes/domain-core'
import { AsymmetricMessageServerHash } from '@standardnotes/responses'

export interface AsymmetricMessageServiceInterface {
  getOutboundMessages(): Promise<Result<AsymmetricMessageServerHash[]>>
  getInboundMessages(): Promise<Result<AsymmetricMessageServerHash[]>>
  downloadAndProcessInboundMessages(): Promise<void>
}

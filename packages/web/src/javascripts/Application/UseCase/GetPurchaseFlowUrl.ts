import { isDesktopApplication } from '@/Utils'
import { ApplicationInterface, LegacyApiServiceInterface, Result, UseCaseInterface } from '@standardnotes/snjs'

export class GetPurchaseFlowUrl implements UseCaseInterface<string> {
  constructor(
    private application: ApplicationInterface,
    private legacyApi: LegacyApiServiceInterface,
  ) {}

  async execute(): Promise<Result<string>> {
    const currentUrl = window.location.origin
    const successUrl = isDesktopApplication() ? 'standardnotes://' : currentUrl

    if (this.application.sessions.isSignedOut() || this.application.isThirdPartyHostUsed()) {
      return Result.ok(`${window.purchaseUrl}/offline?&success_url=${successUrl}`)
    }

    const token = await this.legacyApi.getNewSubscriptionToken()
    if (token) {
      return Result.ok(`${window.purchaseUrl}?subscription_token=${token}&success_url=${successUrl}`)
    }

    return Result.fail('Could not get purchase flow URL.')
  }
}

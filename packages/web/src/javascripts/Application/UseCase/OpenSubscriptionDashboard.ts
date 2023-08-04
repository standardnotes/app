import { Environment, LegacyApiServiceInterface, Result, UseCaseInterface } from '@standardnotes/snjs'
import { WebApplicationInterface } from '@standardnotes/ui-services'

export class OpenSubscriptionDashboard implements UseCaseInterface<void> {
  constructor(
    private application: WebApplicationInterface,
    private legacyApi: LegacyApiServiceInterface,
  ) {}

  async execute(): Promise<Result<void>> {
    const token = await this.legacyApi.getNewSubscriptionToken()
    if (!token) {
      return Result.fail('Could not get subscription token.')
    }

    const url = `${window.dashboardUrl}?subscription_token=${token}`

    if (this.application.device.environment === Environment.Mobile) {
      this.application.device.openUrl(url)
      return Result.ok()
    }

    if (this.application.device.environment === Environment.Desktop) {
      window.open(url, '_blank')
      return Result.ok()
    }

    const windowProxy = window.open('', '_blank')
    ;(windowProxy as WindowProxy).location = url

    return Result.ok()
  }
}

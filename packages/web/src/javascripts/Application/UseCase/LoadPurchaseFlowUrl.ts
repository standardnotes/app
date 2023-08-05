import { Environment, Result, UseCaseInterface } from '@standardnotes/snjs'
import { GetPurchaseFlowUrl } from './GetPurchaseFlowUrl'
import { RouteType, WebApplicationInterface } from '@standardnotes/ui-services'

export class LoadPurchaseFlowUrl implements UseCaseInterface<void> {
  constructor(
    private application: WebApplicationInterface,
    private _getPurchaseFlowUrl: GetPurchaseFlowUrl,
  ) {}

  async execute(): Promise<Result<void>> {
    const urlResult = await this._getPurchaseFlowUrl.execute()
    if (urlResult.isFailed()) {
      return urlResult
    }

    const url = urlResult.getValue()
    const route = this.application.routeService.getRoute()
    const params = route.type === RouteType.Purchase ? route.purchaseParams : { period: null, plan: null }
    const period = params.period ? `&period=${params.period}` : ''
    const plan = params.plan ? `&plan=${params.plan}` : ''

    if (url) {
      const finalUrl = `${url}${period}${plan}`

      if (this.application.isNativeMobileWeb()) {
        this.application.mobileDevice.openUrl(finalUrl)
      } else if (this.application.environment === Environment.Desktop) {
        this.application.desktopDevice?.openUrl(finalUrl)
      } else {
        const windowProxy = window.open('', '_blank')
        ;(windowProxy as WindowProxy).location = finalUrl
      }

      return Result.ok()
    }

    return Result.fail('Could not load purchase flow URL.')
  }
}

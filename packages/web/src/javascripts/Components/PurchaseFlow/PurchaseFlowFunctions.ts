import { WebApplication } from '@/Application/WebApplication'
import { isDesktopApplication } from '@/Utils'
import { Environment } from '@standardnotes/snjs'
import { RouteType } from '@standardnotes/ui-services'

export const getPurchaseFlowUrl = async (application: WebApplication): Promise<string | undefined> => {
  const currentUrl = window.location.origin
  const successUrl = isDesktopApplication() ? 'standardnotes://' : currentUrl

  if (application.noAccount() || (await application.isUsingHomeServer())) {
    return `${window.purchaseUrl}/offline?&success_url=${successUrl}`
  }

  const token = await application.getNewSubscriptionToken()
  if (token) {
    return `${window.purchaseUrl}?subscription_token=${token}&success_url=${successUrl}`
  }

  return undefined
}

export const loadPurchaseFlowUrl = async (application: WebApplication): Promise<boolean> => {
  const url = await getPurchaseFlowUrl(application)
  const route = application.routeService.getRoute()
  const params = route.type === RouteType.Purchase ? route.purchaseParams : { period: null, plan: null }
  const period = params.period ? `&period=${params.period}` : ''
  const plan = params.plan ? `&plan=${params.plan}` : ''

  if (url) {
    const finalUrl = `${url}${period}${plan}`

    if (application.isNativeMobileWeb()) {
      application.mobileDevice().openUrl(finalUrl)
    } else if (application.environment === Environment.Desktop) {
      application.desktopDevice?.openUrl(finalUrl)
    } else {
      const windowProxy = window.open('', '_blank')
      ;(windowProxy as WindowProxy).location = finalUrl
    }

    return true
  }

  return false
}

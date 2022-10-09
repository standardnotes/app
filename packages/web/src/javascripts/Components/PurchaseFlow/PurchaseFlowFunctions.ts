import { WebApplication } from '@/Application/Application'
import { getWindowUrlParams, isDesktopApplication } from '@/Utils'

export const getPurchaseFlowUrl = async (application: WebApplication): Promise<string | undefined> => {
  const currentUrl = window.location.origin
  const successUrl = isDesktopApplication() ? 'standardnotes://' : currentUrl
  if (application.noAccount()) {
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
  const params = getWindowUrlParams()
  const period = params.get('period') ? `&period=${params.get('period')}` : ''
  const plan = params.get('plan') ? `&plan=${params.get('plan')}` : ''
  if (url) {
    const finalUrl = `${url}${period}${plan}`

    if (application.isNativeMobileWeb()) {
      application.mobileDevice().openUrl(finalUrl)
    } else {
      const windowProxy = window.open('', '_blank')
      ;(windowProxy as WindowProxy).location = finalUrl
    }

    return true
  }
  return false
}

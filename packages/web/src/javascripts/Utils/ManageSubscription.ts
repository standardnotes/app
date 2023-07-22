import { Environment } from '@standardnotes/snjs'
import { WebApplicationInterface } from '@standardnotes/ui-services'

export async function openSubscriptionDashboard(application: WebApplicationInterface) {
  const token = await application.getNewSubscriptionToken()
  if (!token) {
    return
  }

  const url = `${window.dashboardUrl}?subscription_token=${token}`

  if (application.device.environment === Environment.Mobile) {
    application.device.openUrl(url)
    return
  }

  if (application.device.environment === Environment.Desktop) {
    window.open(url, '_blank')
    return
  }

  const windowProxy = window.open('', '_blank')
  ;(windowProxy as WindowProxy).location = url
}

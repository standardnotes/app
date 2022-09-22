import { Environment, SNApplication } from '@standardnotes/snjs'

export async function openSubscriptionDashboard(application: SNApplication) {
  const token = await application.getNewSubscriptionToken()
  if (!token) {
    return
  }

  const url = `${window.dashboardUrl}?subscription_token=${token}`

  if (application.deviceInterface.environment === Environment.NativeMobileWeb) {
    application.deviceInterface.openUrl(url)
  }

  const windowProxy = window.open('', '_blank')
  ;(windowProxy as WindowProxy).location = url
}

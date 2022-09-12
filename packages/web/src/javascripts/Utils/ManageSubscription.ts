import { SNApplication } from '@standardnotes/snjs'

export function openSubscriptionDashboard(application: SNApplication): void {
  const winOpen = window.open('', '_blank')
  application
    .getNewSubscriptionToken()
    .then((token) => {
      if (!token) {
        return
      }
      ;(winOpen as WindowProxy).location = `${window.dashboardUrl}?subscription_token=${token}`
    })
    .catch(console.error)
}

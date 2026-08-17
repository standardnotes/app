import { InternalFeature, InternalFeatureService } from '@standardnotes/snjs'
import { WebApplicationInterface } from '@standardnotes/ui-services'

export class DevMode {
  constructor(private application: WebApplicationInterface) {
    InternalFeatureService.get().enableFeature(InternalFeature.Vaults)
  }

  /** Valid only when running a mock event publisher on port 3124 */
  async purchaseMockSubscription() {
    const subscriptionId = 2002
    const email = this.application.sessions.getUser()?.email
    const response = await fetch('http://localhost:3124/events', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType: 'SUBSCRIPTION_PURCHASED',
        eventPayload: {
          userEmail: email,
          subscriptionId: subscriptionId,
          subscriptionName: 'PRO_PLAN',
          subscriptionExpiresAt: (new Date().getTime() + 3_600_000) * 1_000,
          timestamp: Date.now(),
          offline: false,
          discountCode: null,
          limitedDiscountPurchased: false,
          newSubscriber: true,
          totalActiveSubscriptionsCount: 1,
          userRegisteredAt: 1,
          billingFrequency: 12,
          payAmount: 59.0,
        },
      }),
    })

    if (!response.ok) {
      console.error(`Failed to publish mocked event: ${response.status} ${response.statusText}`)
    }
  }
}

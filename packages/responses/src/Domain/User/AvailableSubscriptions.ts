import { AnyFeatureDescription } from '@standardnotes/features'
import { SubscriptionName } from '@standardnotes/common'

export type AvailableSubscriptions = {
  [key in SubscriptionName]: {
    name: string
    pricing: {
      price: number
      period: string
    }[]
    features: AnyFeatureDescription[]
  }
}

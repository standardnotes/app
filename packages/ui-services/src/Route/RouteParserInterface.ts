import { DemoParams } from './Params/DemoParams'
import { OnboardingParams } from './Params/OnboardingParams'
import { PurchaseParams } from './Params/PurchaseParams'
import { SettingsParams } from './Params/SettingsParams'
import { SubscriptionInviteParams } from './Params/SubscriptionInviteParams'

export interface RouteParserInterface {
  get demoParams(): DemoParams
  get settingsParams(): SettingsParams
  get purchaseParams(): PurchaseParams
  get onboardingParams(): OnboardingParams
  get subscriptionInviteParams(): SubscriptionInviteParams
}

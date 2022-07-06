import { ClientDisplayableError } from '@standardnotes/responses'

export type SetOfflineFeaturesFunctionResponse = ClientDisplayableError | undefined

export type OfflineSubscriptionEntitlements = {
  featuresUrl: string
  extensionKey: string
}

export enum FeaturesEvent {
  UserRolesChanged = 'UserRolesChanged',
  FeaturesUpdated = 'FeaturesUpdated',
}

export enum FeatureStatus {
  NoUserSubscription = 'NoUserSubscription',
  NotInCurrentPlan = 'NotInCurrentPlan',
  InCurrentPlanButExpired = 'InCurrentPlanButExpired',
  Entitled = 'Entitled',
}

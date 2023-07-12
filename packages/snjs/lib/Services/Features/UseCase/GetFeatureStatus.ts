import { AnyFeatureDescription, FeatureIdentifier, FindNativeFeature } from '@standardnotes/features'
import { Subscription } from '@standardnotes/security'
import { FeatureStatus, ItemManagerInterface } from '@standardnotes/services'
import { convertTimestampToMilliseconds } from '@standardnotes/utils'

export class GetFeatureStatusUseCase {
  constructor(private items: ItemManagerInterface) {}

  execute(dto: {
    featureId: FeatureIdentifier | string
    firstPartyOnlineSubscription: Subscription | undefined
    firstPartyRoles: { online: string[] } | { offline: string[] } | undefined
    hasPaidAnyPartyOnlineOrOfflineSubscription: boolean
  }): FeatureStatus {
    if (this.isFreeFeature(dto.featureId as FeatureIdentifier)) {
      return FeatureStatus.Entitled
    }

    const nativeFeature = FindNativeFeature(dto.featureId as FeatureIdentifier)

    if (!nativeFeature) {
      return this.getThirdPartyFeatureStatus(dto.featureId as string)
    }

    if (nativeFeature.deprecated) {
      return this.getDeprecatedNativeFeatureStatus({
        nativeFeature,
        hasPaidAnyPartyOnlineOrOfflineSubscription: dto.hasPaidAnyPartyOnlineOrOfflineSubscription,
      })
    }

    return this.getNativeFeatureFeatureStatus({
      nativeFeature,
      firstPartyOnlineSubscription: dto.firstPartyOnlineSubscription,
      firstPartyRoles: dto.firstPartyRoles,
    })
  }

  private getDeprecatedNativeFeatureStatus(dto: {
    hasPaidAnyPartyOnlineOrOfflineSubscription: boolean
    nativeFeature: AnyFeatureDescription
  }): FeatureStatus {
    if (dto.hasPaidAnyPartyOnlineOrOfflineSubscription) {
      return FeatureStatus.Entitled
    } else {
      return FeatureStatus.NoUserSubscription
    }
  }

  private getNativeFeatureFeatureStatus(dto: {
    nativeFeature: AnyFeatureDescription
    firstPartyOnlineSubscription: Subscription | undefined
    firstPartyRoles: { online: string[] } | { offline: string[] } | undefined
  }): FeatureStatus {
    if (!dto.firstPartyOnlineSubscription && !dto.firstPartyRoles) {
      return FeatureStatus.NoUserSubscription
    }

    const roles = !dto.firstPartyRoles
      ? undefined
      : 'online' in dto.firstPartyRoles
      ? dto.firstPartyRoles.online
      : dto.firstPartyRoles.offline

    if (dto.nativeFeature.availableInRoles && roles) {
      const hasRole = roles.some((role) => {
        return dto.nativeFeature.availableInRoles?.includes(role)
      })

      if (!hasRole) {
        return FeatureStatus.NotInCurrentPlan
      }
    }

    if (dto.firstPartyOnlineSubscription) {
      const isSubscriptionExpired =
        new Date(convertTimestampToMilliseconds(dto.firstPartyOnlineSubscription.endsAt)) < new Date()

      if (isSubscriptionExpired) {
        return FeatureStatus.InCurrentPlanButExpired
      }
    }

    return FeatureStatus.Entitled
  }

  private getThirdPartyFeatureStatus(featureId: string): FeatureStatus {
    const component = this.items.getDisplayableComponents().find((candidate) => candidate.identifier === featureId)

    if (!component) {
      return FeatureStatus.NoUserSubscription
    }

    if (component.isExpired) {
      return FeatureStatus.InCurrentPlanButExpired
    }

    return FeatureStatus.Entitled
  }

  private isFreeFeature(featureId: FeatureIdentifier) {
    return [FeatureIdentifier.DarkTheme, FeatureIdentifier.PlainEditor].includes(featureId)
  }
}

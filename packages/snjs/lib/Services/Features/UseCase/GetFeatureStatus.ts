import { FeatureIdentifier, FindNativeFeature } from '@standardnotes/features'
import { FeatureStatus, ItemManagerInterface } from '@standardnotes/services'

export class GetFeatureStatusUseCase {
  constructor(private items: ItemManagerInterface) {}

  execute(dto: {
    featureId: FeatureIdentifier | string
    hasPaidAnyPartyOnlineOrOfflineSubscription: boolean
    hasFirstPartySubscription: boolean
    roles: string[]
  }): FeatureStatus {
    if (this.isFreeFeature(dto.featureId as FeatureIdentifier)) {
      return FeatureStatus.Entitled
    }

    const nativeFeature = FindNativeFeature(dto.featureId as FeatureIdentifier)

    if (nativeFeature?.deprecated) {
      if (dto.hasPaidAnyPartyOnlineOrOfflineSubscription) {
        return FeatureStatus.Entitled
      } else {
        return FeatureStatus.NoUserSubscription
      }
    }

    const isThirdParty = nativeFeature == undefined
    if (isThirdParty) {
      const component = this.items
        .getDisplayableComponents()
        .find((candidate) => candidate.identifier === dto.featureId)

      if (!component) {
        return FeatureStatus.NoUserSubscription
      }

      if (component.isExpired) {
        return FeatureStatus.InCurrentPlanButExpired
      }

      return FeatureStatus.Entitled
    }

    if (nativeFeature) {
      if (!dto.hasFirstPartySubscription) {
        return FeatureStatus.NoUserSubscription
      }

      if (nativeFeature.availableInRoles) {
        const hasRole = dto.roles.some((role) => {
          return nativeFeature.availableInRoles?.includes(role)
        })
        if (!hasRole) {
          return FeatureStatus.NotInCurrentPlan
        }
      }
    }

    return FeatureStatus.Entitled
  }

  private isFreeFeature(featureId: FeatureIdentifier) {
    return [FeatureIdentifier.DarkTheme].includes(featureId)
  }
}

import { InternalFeature, InternalFeatureService } from '@standardnotes/snjs'

export enum FeatureTrunkName {}

const FeatureTrunkStatus: Record<FeatureTrunkName, boolean> = {}

export function featureTrunkEnabled(trunk: FeatureTrunkName): boolean {
  return FeatureTrunkStatus[trunk]
}

export function featureTrunkVaultsEnabled(): boolean {
  return InternalFeatureService.get().isFeatureEnabled(InternalFeature.Vaults)
}

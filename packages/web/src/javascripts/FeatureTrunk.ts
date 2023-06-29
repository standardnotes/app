import { isDev } from '@/Utils'

export enum FeatureTrunkName {
  Vaults,
}

const FeatureTrunkStatus: Record<FeatureTrunkName, boolean> = {
  [FeatureTrunkName.Vaults]: isDev && false,
}

export function featureTrunkEnabled(trunk: FeatureTrunkName): boolean {
  return FeatureTrunkStatus[trunk]
}

import { isDev } from '@/Utils'

export enum FeatureTrunkName {
  Super,
}

const FeatureTrunkStatus: Record<FeatureTrunkName, boolean> = {
  [FeatureTrunkName.Super]: isDev && true,
}

export function featureTrunkEnabled(trunk: FeatureTrunkName): boolean {
  return FeatureTrunkStatus[trunk]
}

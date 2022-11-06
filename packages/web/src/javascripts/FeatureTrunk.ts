import { isDev } from '@/Utils'

export enum FeatureTrunkName {
  Blocks,
}

export const FeatureTrunkStatus: Record<FeatureTrunkName, boolean> = {
  [FeatureTrunkName.Blocks]: isDev && true,
}

export function featureTrunkEnabled(trunk: FeatureTrunkName): boolean {
  return FeatureTrunkStatus[trunk]
}

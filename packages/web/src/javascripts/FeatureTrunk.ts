import { isDev } from '@/Utils'

export enum FeatureTrunkName {
  Super,
  ImportTools,
  U2F,
}

const FeatureTrunkStatus: Record<FeatureTrunkName, boolean> = {
  [FeatureTrunkName.Super]: isDev && true,
  [FeatureTrunkName.ImportTools]: isDev && true,
  [FeatureTrunkName.U2F]: isDev && true,
}

export function featureTrunkEnabled(trunk: FeatureTrunkName): boolean {
  return FeatureTrunkStatus[trunk]
}

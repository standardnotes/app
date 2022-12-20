import { isDev } from '@/Utils'

export enum FeatureTrunkName {
  Super,
  FilesTableView,
}

const FeatureTrunkStatus: Record<FeatureTrunkName, boolean> = {
  [FeatureTrunkName.Super]: isDev && true,
  [FeatureTrunkName.FilesTableView]: isDev && true,
}

export function featureTrunkEnabled(trunk: FeatureTrunkName): boolean {
  return FeatureTrunkStatus[trunk]
}

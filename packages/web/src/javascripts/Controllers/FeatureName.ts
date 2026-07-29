import { SuperName, jtString } from '@standardnotes/features'
import { c } from 'ttag'

export enum FeatureName {
  Files = 'Files',
  Super = 'Super',
}

export function getFeatureNameLabel(feature: FeatureName): string {
  switch (feature) {
    case FeatureName.Files:
      return c('B7.FilesSubscriptionHelp.Subscription.Label').t`Encrypted File Storage`
    case FeatureName.Super:
      return jtString(c('B7.FilesSubscriptionHelp.Subscription.Label').jt`${SuperName} notes`)
  }
}

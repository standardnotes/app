import { ClientFeatureDescription } from '../Feature/FeatureDescription'
import { PermissionName } from '../Permission/PermissionName'
import { FeatureIdentifier } from '../Feature/FeatureIdentifier'
import { SubscriptionName } from '@standardnotes/common'

export function clientFeatures(): ClientFeatureDescription[] {
  return [
    {
      availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
      name: 'Tag Nesting',
      identifier: FeatureIdentifier.TagNesting,
      permission_name: PermissionName.TagNesting,
      description: 'Organize your tags into folders.',
    },
    {
      availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
      name: 'Smart Filters',
      identifier: FeatureIdentifier.SmartFilters,
      permission_name: PermissionName.SmartFilters,
      description: 'Create smart filters for viewing notes matching specific criteria.',
    },
    {
      availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
      name: 'Encrypted files',
      identifier: FeatureIdentifier.Files,
      permission_name: PermissionName.Files,
      description: '',
    },
    {
      availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
      name: 'Focus Mode',
      identifier: FeatureIdentifier.FocusMode,
      permission_name: PermissionName.FocusMode,
      description: '',
    },
    {
      availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
      name: 'Listed Custom Domain',
      identifier: FeatureIdentifier.ListedCustomDomain,
      permission_name: PermissionName.ListedCustomDomain,
      description: '',
    },
    {
      availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
      name: 'Multiple accounts',
      identifier: FeatureIdentifier.AccountSwitcher,
      permission_name: PermissionName.AccountSwitcher,
      description: '',
    },
  ]
}

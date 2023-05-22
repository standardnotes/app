import { ServerFeatureDescription } from '../Feature/FeatureDescription'
import { PermissionName } from '../Permission/PermissionName'
import { FeatureIdentifier } from '../Feature/FeatureIdentifier'
import { SubscriptionName } from '@standardnotes/common'
import { RoleName } from '@standardnotes/domain-core'

export function serverFeatures(): ServerFeatureDescription[] {
  return [
    {
      availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
      name: 'Two factor authentication',
      identifier: FeatureIdentifier.TwoFactorAuth,
      permission_name: PermissionName.TwoFactorAuth,
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
    },
    {
      availableInSubscriptions: [SubscriptionName.ProPlan],
      name: 'U2F authentication',
      identifier: FeatureIdentifier.UniversalSecondFactor,
      permission_name: PermissionName.UniversalSecondFactor,
      availableInRoles: [RoleName.NAMES.ProUser],
    },
    {
      availableInSubscriptions: [SubscriptionName.ProPlan],
      name: 'Unlimited note history',
      identifier: FeatureIdentifier.NoteHistoryUnlimited,
      permission_name: PermissionName.NoteHistoryUnlimited,
      availableInRoles: [RoleName.NAMES.ProUser],
    },
    {
      availableInSubscriptions: [SubscriptionName.PlusPlan],
      name: '365 days note history',
      identifier: FeatureIdentifier.NoteHistory365Days,
      permission_name: PermissionName.NoteHistory365Days,
      availableInRoles: [RoleName.NAMES.PlusUser],
    },
    {
      availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
      name: 'Email backups',
      identifier: FeatureIdentifier.DailyEmailBackup,
      permission_name: PermissionName.DailyEmailBackup,
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
    },
    {
      availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
      name: 'Sign-in email alerts',
      identifier: FeatureIdentifier.SignInAlerts,
      permission_name: PermissionName.SignInAlerts,
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
    },
    {
      availableInSubscriptions: [SubscriptionName.ProPlan],
      identifier: FeatureIdentifier.FilesMaximumStorageTier,
      permission_name: PermissionName.FilesMaximumStorageTier,
      availableInRoles: [RoleName.NAMES.ProUser],
    },
    {
      availableInSubscriptions: [SubscriptionName.PlusPlan],
      identifier: FeatureIdentifier.FilesLowStorageTier,
      permission_name: PermissionName.FilesLowStorageTier,
      availableInRoles: [RoleName.NAMES.PlusUser],
    },
    {
      availableInSubscriptions: [SubscriptionName.ProPlan],
      identifier: FeatureIdentifier.SubscriptionSharing,
      permission_name: PermissionName.SubscriptionSharing,
      availableInRoles: [RoleName.NAMES.ProUser],
    },
    {
      availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
      name: 'Listed Custom Domain',
      identifier: FeatureIdentifier.ListedCustomDomain,
      permission_name: PermissionName.ListedCustomDomain,
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
    },
  ]
}

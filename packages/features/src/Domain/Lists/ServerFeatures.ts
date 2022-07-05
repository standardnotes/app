import { ServerFeatureDescription } from '../Feature/FeatureDescription'
import { PermissionName } from '../Permission/PermissionName'
import { FeatureIdentifier } from '../Feature/FeatureIdentifier'
import { SubscriptionName } from '@standardnotes/common'

export function serverFeatures(): ServerFeatureDescription[] {
  return [
    {
      availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
      name: 'Two factor authentication',
      identifier: FeatureIdentifier.TwoFactorAuth,
      permission_name: PermissionName.TwoFactorAuth,
    },
    {
      availableInSubscriptions: [SubscriptionName.ProPlan],
      name: 'Unlimited note history',
      identifier: FeatureIdentifier.NoteHistoryUnlimited,
      permission_name: PermissionName.NoteHistoryUnlimited,
    },
    {
      availableInSubscriptions: [SubscriptionName.PlusPlan],
      name: '365 days note history',
      identifier: FeatureIdentifier.NoteHistory365Days,
      permission_name: PermissionName.NoteHistory365Days,
    },
    {
      availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
      name: 'Email backups',
      identifier: FeatureIdentifier.DailyEmailBackup,
      permission_name: PermissionName.DailyEmailBackup,
    },
    {
      availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
      name: 'Sign-in email alerts',
      identifier: FeatureIdentifier.SignInAlerts,
      permission_name: PermissionName.SignInAlerts,
    },
    {
      availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
      identifier: FeatureIdentifier.DailyDropboxBackup,
      permission_name: PermissionName.DailyDropboxBackup,
    },
    {
      availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
      identifier: FeatureIdentifier.DailyGDriveBackup,
      permission_name: PermissionName.DailyGDriveBackup,
    },
    {
      availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
      identifier: FeatureIdentifier.DailyOneDriveBackup,
      permission_name: PermissionName.DailyOneDriveBackup,
    },
    {
      availableInSubscriptions: [SubscriptionName.ProPlan],
      identifier: FeatureIdentifier.FilesMaximumStorageTier,
      permission_name: PermissionName.FilesMaximumStorageTier,
    },
    {
      availableInSubscriptions: [SubscriptionName.PlusPlan],
      identifier: FeatureIdentifier.FilesLowStorageTier,
      permission_name: PermissionName.FilesLowStorageTier,
    },
  ]
}

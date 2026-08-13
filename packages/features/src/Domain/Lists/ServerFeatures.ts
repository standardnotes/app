import { ServerFeatureDescription } from '../Feature/ServerFeatureDescription'
import { PermissionName } from '../Permission/PermissionName'
import { NativeFeatureIdentifier } from '../Feature/NativeFeatureIdentifier'
import { RoleName } from '@standardnotes/domain-core'
import { c } from 'ttag'
import { ListedName, jtString } from '../Strings/ProductNames'

export function serverFeatures(): ServerFeatureDescription[] {
  return [
    {
      name: c('B7.FilesSubscriptionHelp.Subscription.Info').t`Two factor authentication`,
      identifier: NativeFeatureIdentifier.TYPES.TwoFactorAuth,
      permission_name: PermissionName.TwoFactorAuth,
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
    },
    {
      name: c('B7.FilesSubscriptionHelp.Subscription.Info').t`U2F authentication`,
      identifier: NativeFeatureIdentifier.TYPES.UniversalSecondFactor,
      permission_name: PermissionName.UniversalSecondFactor,
      availableInRoles: [RoleName.NAMES.ProUser],
    },
    {
      name: c('B7.FilesSubscriptionHelp.Subscription.Info').t`Unlimited note history`,
      identifier: NativeFeatureIdentifier.TYPES.NoteHistoryUnlimited,
      permission_name: PermissionName.NoteHistoryUnlimited,
      availableInRoles: [RoleName.NAMES.ProUser],
    },
    {
      name: c('B7.FilesSubscriptionHelp.Subscription.Info').t`365 days note history`,
      identifier: NativeFeatureIdentifier.TYPES.NoteHistory365Days,
      permission_name: PermissionName.NoteHistory365Days,
      availableInRoles: [RoleName.NAMES.PlusUser],
    },
    {
      name: c('B7.FilesSubscriptionHelp.Subscription.Info').t`Email backups`,
      identifier: NativeFeatureIdentifier.TYPES.DailyEmailBackup,
      permission_name: PermissionName.DailyEmailBackup,
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
    },
    {
      name: c('B7.FilesSubscriptionHelp.Subscription.Info').t`Sign-in email alerts`,
      identifier: NativeFeatureIdentifier.TYPES.SignInAlerts,
      permission_name: PermissionName.SignInAlerts,
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
    },
    {
      name: c('B7.FilesSubscriptionHelp.Subscription.Info').t`Files maximum storage tier`,
      identifier: NativeFeatureIdentifier.TYPES.FilesMaximumStorageTier,
      permission_name: PermissionName.FilesMaximumStorageTier,
      availableInRoles: [RoleName.NAMES.ProUser],
    },
    {
      name: c('B7.FilesSubscriptionHelp.Subscription.Info').t`Files low storage tier`,
      identifier: NativeFeatureIdentifier.TYPES.FilesLowStorageTier,
      permission_name: PermissionName.FilesLowStorageTier,
      availableInRoles: [RoleName.NAMES.PlusUser],
    },
    {
      name: c('B7.FilesSubscriptionHelp.Subscription.Info').t`Files medium storage tier`,
      identifier: NativeFeatureIdentifier.TYPES.SubscriptionSharing,
      permission_name: PermissionName.SubscriptionSharing,
      availableInRoles: [RoleName.NAMES.ProUser],
    },
    {
      name: jtString(c('B7.FilesSubscriptionHelp.Subscription.Info').jt`${ListedName} Custom Domain`),
      identifier: NativeFeatureIdentifier.TYPES.ListedCustomDomain,
      permission_name: PermissionName.ListedCustomDomain,
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
    },
    {
      name: c('B7.FilesSubscriptionHelp.Subscription.Info').t`Shared Vaults`,
      identifier: NativeFeatureIdentifier.TYPES.SharedVaults,
      permission_name: PermissionName.SharedVaults,
      availableInRoles: [RoleName.NAMES.InternalTeamUser],
    },
  ]
}

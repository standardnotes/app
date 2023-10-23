import { ServerFeatureDescription } from '../Feature/ServerFeatureDescription'
import { PermissionName } from '../Permission/PermissionName'
import { NativeFeatureIdentifier } from '../Feature/NativeFeatureIdentifier'
import { RoleName } from '@standardnotes/domain-core'

export function serverFeatures(): ServerFeatureDescription[] {
  return [
    {
      name: 'Two factor authentication',
      identifier: NativeFeatureIdentifier.TYPES.TwoFactorAuth,
      permission_name: PermissionName.TwoFactorAuth,
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
    },
    {
      name: 'U2F authentication',
      identifier: NativeFeatureIdentifier.TYPES.UniversalSecondFactor,
      permission_name: PermissionName.UniversalSecondFactor,
      availableInRoles: [RoleName.NAMES.ProUser],
    },
    {
      name: 'Unlimited note history',
      identifier: NativeFeatureIdentifier.TYPES.NoteHistoryUnlimited,
      permission_name: PermissionName.NoteHistoryUnlimited,
      availableInRoles: [RoleName.NAMES.ProUser],
    },
    {
      name: '365 days note history',
      identifier: NativeFeatureIdentifier.TYPES.NoteHistory365Days,
      permission_name: PermissionName.NoteHistory365Days,
      availableInRoles: [RoleName.NAMES.PlusUser],
    },
    {
      name: 'Email backups',
      identifier: NativeFeatureIdentifier.TYPES.DailyEmailBackup,
      permission_name: PermissionName.DailyEmailBackup,
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
    },
    {
      name: 'Sign-in email alerts',
      identifier: NativeFeatureIdentifier.TYPES.SignInAlerts,
      permission_name: PermissionName.SignInAlerts,
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
    },
    {
      name: 'Files maximum storage tier',
      identifier: NativeFeatureIdentifier.TYPES.FilesMaximumStorageTier,
      permission_name: PermissionName.FilesMaximumStorageTier,
      availableInRoles: [RoleName.NAMES.ProUser],
    },
    {
      name: 'Files low storage tier',
      identifier: NativeFeatureIdentifier.TYPES.FilesLowStorageTier,
      permission_name: PermissionName.FilesLowStorageTier,
      availableInRoles: [RoleName.NAMES.PlusUser],
    },
    {
      name: 'Files medium storage tier',
      identifier: NativeFeatureIdentifier.TYPES.SubscriptionSharing,
      permission_name: PermissionName.SubscriptionSharing,
      availableInRoles: [RoleName.NAMES.ProUser],
    },
    {
      name: 'Listed Custom Domain',
      identifier: NativeFeatureIdentifier.TYPES.ListedCustomDomain,
      permission_name: PermissionName.ListedCustomDomain,
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
    },
    {
      name: 'Shared Vaults',
      identifier: NativeFeatureIdentifier.TYPES.SharedVaults,
      permission_name: PermissionName.SharedVaults,
      availableInRoles: [RoleName.NAMES.InternalTeamUser],
    },
  ]
}

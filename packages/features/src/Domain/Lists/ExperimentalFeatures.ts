import { FeatureIdentifier } from './../Feature/FeatureIdentifier'
import { RoleName, SubscriptionName } from '@standardnotes/common'
import { FeatureDescription } from '../Feature/FeatureDescription'
import { PermissionName } from '../Permission/PermissionName'

export function experimentalFeatures(): FeatureDescription[] {
  const superEditor: FeatureDescription = {
    name: 'Super Notes',
    identifier: FeatureIdentifier.SuperEditor,
    availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
    permission_name: PermissionName.SuperEditor,
    description: 'A new way to edit notes.',
    availableInRoles: [RoleName.PlusUser, RoleName.ProUser],
  }

  return [superEditor]
}

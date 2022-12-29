import { RoleName, SubscriptionName } from '@standardnotes/common'
import { FeatureDescription } from '../Feature/FeatureDescription'
import { FeatureIdentifier } from '../Feature/FeatureIdentifier'
import { PermissionName } from '../Permission/PermissionName'

export function experimentalFeatures(): FeatureDescription[] {
  const filesTableView: FeatureDescription = {
    identifier: FeatureIdentifier.FilesTableView,
    name: 'Files Table View',
    description:
      'Replaces the current Files view with a table view, with name, size, and date sort options. Requires reload to take effect.',
    availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
    availableInRoles: [RoleName.PlusUser, RoleName.ProUser],
    permission_name: PermissionName.FilesTableView,
  }

  return [filesTableView]
}

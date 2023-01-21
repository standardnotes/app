import { FeatureDescription } from '../Feature/FeatureDescription'
import { PermissionName } from '../Permission/PermissionName'
import { FeatureIdentifier } from '../Feature/FeatureIdentifier'
import { SubscriptionName } from '@standardnotes/common'
import { RoleName } from '@standardnotes/domain-core'
import { themes } from './Themes'
import { editors } from './Editors'

export function clientFeatures(): FeatureDescription[] {
  return [
    ...themes(),
    ...editors(),
    {
      name: 'Tag Nesting',
      availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
      identifier: FeatureIdentifier.TagNesting,
      permission_name: PermissionName.TagNesting,
      description: 'Organize your tags into folders.',
    },
    {
      name: 'Super Notes',
      identifier: FeatureIdentifier.SuperEditor,
      availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
      permission_name: PermissionName.SuperEditor,
      description:
        'A new way to edit notes. Type / to bring up the block selection menu, or @ to embed images or link other tags and notes. Type - then space to start a list, or [] then space to start a checklist. Drag and drop an image or file to embed it in your note. Cmd/Ctrl + F to bring up search and replace.',
    },
    {
      name: 'Smart Filters',
      availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
      availableInRoles: [RoleName.NAMES.PlusUser, RoleName.NAMES.ProUser],
      identifier: FeatureIdentifier.SmartFilters,
      permission_name: PermissionName.SmartFilters,
      description: 'Create smart filters for viewing notes matching specific criteria.',
    },
    {
      name: 'Encrypted files',
      availableInSubscriptions: [SubscriptionName.PlusPlan, SubscriptionName.ProPlan],
      availableInRoles: [RoleName.NAMES.ProUser],
      identifier: FeatureIdentifier.Files,
      permission_name: PermissionName.Files,
      description: '',
    },
  ]
}

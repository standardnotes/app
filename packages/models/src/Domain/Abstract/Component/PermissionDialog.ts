import { ComponentPermission } from '@standardnotes/features'
import { ComponentOrNativeFeature } from '../../Syncable/Component'

export type PermissionDialog = {
  component: ComponentOrNativeFeature
  permissions: ComponentPermission[]
  permissionsString: string
  actionBlock: (approved: boolean) => void
  callback: (approved: boolean) => void
}

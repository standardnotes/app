import { ComponentPermission } from '@standardnotes/features'
import { ComponentInterface } from '../../Syncable/Component'

export type PermissionDialog = {
  component: ComponentInterface
  permissions: ComponentPermission[]
  permissionsString: string
  actionBlock: (approved: boolean) => void
  callback: (approved: boolean) => void
}

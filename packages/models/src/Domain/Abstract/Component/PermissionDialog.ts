import { ComponentPermission } from '@standardnotes/features'
import { SNComponent } from '../../Syncable/Component'

export type PermissionDialog = {
  component: SNComponent
  permissions: ComponentPermission[]
  permissionsString: string
  actionBlock: (approved: boolean) => void
  callback: (approved: boolean) => void
}

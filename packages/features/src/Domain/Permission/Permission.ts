import { Uuid } from '@standardnotes/common'

import { PermissionName } from './PermissionName'

export type Permission = {
  uuid: Uuid
  name: PermissionName
}

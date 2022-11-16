import { WorkspaceType } from '@standardnotes/common'

export type Workspace = {
  uuid: string
  type: WorkspaceType
  name: string | null
  keyRotationIndex: number
  createdAt: number
  updatedAt: number
}

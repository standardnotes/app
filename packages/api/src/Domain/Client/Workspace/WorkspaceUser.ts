import { Uuid, WorkspaceAccessLevel, WorkspaceUserStatus } from '@standardnotes/common'

export type WorkspaceUser = {
  uuid: Uuid
  accessLevel: WorkspaceAccessLevel
  userUuid: Uuid
  userDisplayName: string | null
  workspaceUuid: Uuid
  encryptedWorkspaceKey: string | null
  publicKey: string | null
  encryptedPrivateKey: string | null
  status: WorkspaceUserStatus
  keyRotationIndex: number
  createdAt: number
  updatedAt: number
}

import { RoleName } from '@standardnotes/common'

export type RevisionListEntry = {
  content_type: string
  created_at: string
  updated_at: string
  /** The uuid of the revision */
  uuid: string
  required_role: RoleName
}

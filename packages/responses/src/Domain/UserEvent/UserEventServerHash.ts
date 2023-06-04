import { UserEventType } from './UserEventType'

export type UserEventServerHash = {
  uuid: string
  user_uuid: string
  event_type: UserEventType
  event_payload: string
  created_at_timestamp?: number
  updated_at_timestamp?: number
}

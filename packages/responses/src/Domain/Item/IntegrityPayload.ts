import { MicrosecondsTimestamp, Uuid } from '@standardnotes/common'

export type IntegrityPayload = {
  uuid: Uuid
  updated_at_timestamp: MicrosecondsTimestamp
}

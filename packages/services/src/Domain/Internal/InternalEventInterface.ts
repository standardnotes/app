import { InternalEventType } from './InternalEventType'

export interface InternalEventInterface {
  type: InternalEventType
  payload: unknown
}

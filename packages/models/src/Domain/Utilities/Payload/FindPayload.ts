import { Uuid } from '@standardnotes/common'
import { PayloadInterface } from '../../Abstract/Payload/Interfaces/PayloadInterface'

export function FindPayload<P extends PayloadInterface = PayloadInterface>(payloads: P[], uuid: Uuid): P | undefined {
  return payloads.find((payload) => payload.uuid === uuid)
}

export function SureFindPayload<P extends PayloadInterface = PayloadInterface>(payloads: P[], uuid: Uuid): P {
  return FindPayload(payloads, uuid) as P
}

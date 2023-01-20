import { PayloadInterface } from '../../Abstract/Payload/Interfaces/PayloadInterface'

export function FindPayload<P extends PayloadInterface = PayloadInterface>(payloads: P[], uuid: string): P | undefined {
  return payloads.find((payload) => payload.uuid === uuid)
}

export function SureFindPayload<P extends PayloadInterface = PayloadInterface>(payloads: P[], uuid: string): P {
  return FindPayload(payloads, uuid) as P
}

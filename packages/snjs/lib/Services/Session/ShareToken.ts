import { RawSessionPayload } from './Sessions/Types'

export type ShareToken = RawSessionPayload & {
  email: string
  password: string
}

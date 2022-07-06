import { SessionBody } from './SessionBody'
import { User } from './User'

export type RegistrationData = {
  session?: SessionBody
  /** Represents legacy JWT token */
  token?: string
  user?: User
}

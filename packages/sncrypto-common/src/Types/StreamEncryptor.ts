import { Base64String } from './Base64String'
import { SodiumStateAddress } from './SodiumStateAddress'

export type StreamEncryptor = {
  state: SodiumStateAddress
  header: Base64String
}

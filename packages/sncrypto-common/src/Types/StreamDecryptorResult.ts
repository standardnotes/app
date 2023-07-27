import { SodiumTag } from './SodiumTag'

export type StreamDecryptorResult = {
  message: Uint8Array
  tag: SodiumTag
}

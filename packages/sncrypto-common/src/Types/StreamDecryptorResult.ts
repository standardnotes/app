import { SodiumConstant } from './SodiumConstant'

export type StreamDecryptorResult = {
  message: Uint8Array
  tag: SodiumConstant
}

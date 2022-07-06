import { HexString } from '../Types/HexString'
import { Utf8String } from '../Types/Utf8String'

export interface CryptoSha256Interface {
  sha256(text: Utf8String): HexString
}

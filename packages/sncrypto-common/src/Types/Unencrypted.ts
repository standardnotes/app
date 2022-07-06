import { Utf8String } from './Utf8String'

/**
 * Either a plaintext (UTF-8 string) or a `string` with an `encoding`.
 */
export type Unencrypted<EncodingType> = Utf8String | { string: string; encoding: EncodingType }

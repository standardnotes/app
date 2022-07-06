/* eslint-disable camelcase */
import { base64_variants, from_base64, from_hex, from_string, to_base64, to_hex, to_string } from './libsodium'
import { Buffer } from 'buffer'
import { v4 as uuidv4 } from 'uuid'

const SN_BASE64_VARIANT = base64_variants.ORIGINAL

/**
 * Libsodium's to_* functions take either a Buffer or String, but do not take raw buffers,
 * as may be returned by WebCrypto API.
 */

declare global {
  interface Document {
    documentMode?: string
  }
  interface Window {
    msCrypto?: Crypto
  }
}

/**
 * Returns `window` if available, or `global` if supported in environment.
 */
export function getGlobalScope(): Window & typeof globalThis {
  return window
}

/**
 * Determines whether we are in an Internet Explorer or Edge environment
 * @access public
 */
export function ieOrEdge(): boolean {
  return (typeof document !== 'undefined' && !!document.documentMode) || /Edge/.test(navigator.userAgent)
}

/**
 * Returns true if WebCrypto is available
 * @access public
 */
export function isWebCryptoAvailable(): boolean {
  return !ieOrEdge() && getGlobalScope().crypto && !!getGlobalScope().crypto.subtle
}

/**
 * Returns the WebCrypto instance
 * @access public
 */
export function getSubtleCrypto(): SubtleCrypto {
  if (!getGlobalScope().crypto) {
    throw Error('Could not obtain SubtleCrypto instance')
  }

  return getGlobalScope().crypto.subtle
}

/**
 * Generates a UUID syncronously
 * @access public
 */
export function generateUUID(): string {
  return uuidv4()
}

/**
 * Converts a plain string into an ArrayBuffer
 * @param {string} string - A plain string
 */
export function stringToArrayBuffer(string: string): Uint8Array {
  return from_string(string)
}

/**
 * Converts an ArrayBuffer into a plain string
 * @param {ArrayBuffer} arrayBuffer
 */
export function arrayBufferToString(arrayBuffer: ArrayBuffer): string {
  return to_string(arrayBuffer as Uint8Array)
}

/**
 * Converts an ArrayBuffer into a hex string
 * @param arrayBuffer
 */
export function arrayBufferToHexString(arrayBuffer: ArrayBuffer): string {
  return to_hex(Buffer.from(arrayBuffer))
}

/**
 * Converts a hex string into an ArrayBuffer
 * @access public
 * @param hex - A hex string
 */
export function hexStringToArrayBuffer(hex: string): Uint8Array {
  return from_hex(hex)
}

/**
 * Converts a base64 string into an ArrayBuffer
 * @param base64 - A base64 string
 */
export function base64ToArrayBuffer(base64: string): Uint8Array {
  return from_base64(base64, SN_BASE64_VARIANT)
}

/**
 * Converts an ArrayBuffer into a base64 string
 * @param buffer
 */
export function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
  return to_base64(Buffer.from(arrayBuffer), SN_BASE64_VARIANT)
}

/**
 * Converts a hex string into a base64 string
 * @param hex - A hex string
 */
export function hexToBase64(hex: string): string {
  return to_base64(from_hex(hex), SN_BASE64_VARIANT)
}

/**
 * Converts a base64 string into a hex string
 * @param base64 - A base64 string
 */
export function base64ToHex(base64: string): string {
  return to_hex(from_base64(base64, SN_BASE64_VARIANT))
}

/**
 * Converts a plain string into base64
 * @param text - A plain string
 * @returns  A base64 encoded string
 */
export function base64Encode(text: string): string {
  return to_base64(text, SN_BASE64_VARIANT)
}

/**
 * Converts a plain string into base64 url safe
 * @param text - A plain string
 * @returns  A base64 url safe encoded string
 */
export function base64URLEncode(text: string): string {
  return to_base64(text, base64_variants.URLSAFE_NO_PADDING)
}

/**
 * Converts a base64 string into a plain string
 * @param base64String - A base64 encoded string
 * @returns A plain string
 */
export function base64Decode(base64String: string): string {
  return to_string(from_base64(base64String, SN_BASE64_VARIANT))
}

const RFC4648 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32Encode(input: ArrayBuffer): string {
  const length = input.byteLength
  const buffer = new Uint8Array(input)

  let bitIdx = 0
  let currentVal = 0
  let output = ''

  for (let i = 0; i < length; i++) {
    currentVal = (currentVal << 8) | buffer[i]
    bitIdx += 8

    while (bitIdx >= 5) {
      output += RFC4648[(currentVal >>> (bitIdx - 5)) & 31]
      bitIdx -= 5
    }
  }

  if (bitIdx > 0) {
    output += RFC4648[(currentVal << (5 - bitIdx)) & 31]
  }

  while (output.length % 8 > 0) {
    output += '='
  }

  return output
}

export function base32Decode(b32Input: string): ArrayBuffer {
  const input = b32Input.toUpperCase().replace(/=+$/, '')

  for (let i = 0; i < input.length; i++) {
    if (!RFC4648.includes(input[i])) {
      throw new Error(`Invalid RFC4648 char ${input[i]} at index ${i}`)
    }
  }

  const output = new Uint8Array(((input.length * 5) / 8) | 0)

  let outIdx = 0
  let bitIdx = 0
  let currentVal = 0

  for (let i = 0; i < input.length; i++) {
    currentVal = (currentVal << 5) | RFC4648.indexOf(input[i])
    bitIdx += 5

    if (bitIdx >= 8) {
      output[outIdx++] = (currentVal >>> (bitIdx - 8)) & 255
      bitIdx -= 8
    }
  }

  return output.buffer
}

/**
 * Truncate HMAC-SHA1 calculated value for HOTP code generation
 */
export function truncateOTP(hsBuffer: ArrayBuffer): number {
  const hs = new Uint8Array(hsBuffer)
  // First we take the last byte of our generated HS and extract last 4 bits out of it.
  // This will be our _offset_, a number between 0 and 15.
  const offset = hs[19] & 0b1111

  // Next we take 4 bytes out of the HS, starting at the offset
  const P = ((hs[offset] & 0x7f) << 24) | (hs[offset + 1] << 16) | (hs[offset + 2] << 8) | hs[offset + 3]

  // Finally, convert it into a binary string representation
  const pString = P.toString(2)

  const Snum = parseInt(pString, 2)

  return Snum
}

/**
 * Pad HOTP counter with leading zeros producing an 8 byte array
 */
export function padStart(counter: number): ArrayBuffer {
  const buffer = new ArrayBuffer(8)
  const bView = new DataView(buffer)

  const byteString = '0'.repeat(64)
  const bCounter = (byteString + counter.toString(2)).slice(-64)

  for (let byte = 0; byte < 64; byte += 8) {
    const byteValue = parseInt(bCounter.slice(byte, byte + 8), 2)
    bView.setUint8(byte / 8, byteValue)
  }

  return buffer
}

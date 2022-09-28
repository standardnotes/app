import { HexString } from './HexString'

export type PkcKeyPair = {
  keyType: 'curve25519' | 'ed25519' | 'x25519'
  privateKey: HexString
  publicKey: HexString
}

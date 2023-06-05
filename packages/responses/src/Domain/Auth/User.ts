export type User = {
  uuid: string
  email: string
  publicKey?: string
  encryptedPrivateKey?: string
  signingPublicKey?: string
  encryptedSigningPrivateKey?: string
}

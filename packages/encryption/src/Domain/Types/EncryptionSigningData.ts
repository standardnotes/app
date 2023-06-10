export type SigningPayloadEmbeddedData = {
  signature: string
  publicKey: string
}

export type SymmetricItemSigningPayload = {
  data?: SigningPayloadEmbeddedData | undefined
}

export type AsymmetricSigningPayload = {
  data: SigningPayloadEmbeddedData
}

export type SigningPayload = SymmetricItemSigningPayload | AsymmetricSigningPayload

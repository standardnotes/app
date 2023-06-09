export type SigningPayloadEmbeddedData = {
  signature: string
  publicKey: string
}

export type SymmetricItemSigningPayload = {
  embeddedValue?: SigningPayloadEmbeddedData | undefined
}

export type AsymmetricSigningPayload = {
  embeddedValue: SigningPayloadEmbeddedData
}

export type SigningPayload = SymmetricItemSigningPayload | AsymmetricSigningPayload

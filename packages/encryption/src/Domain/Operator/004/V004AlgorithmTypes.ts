export const V004AsymmetricCiphertextPrefix = '004_Asym'
export const V004PartitionCharacter = ':'

export type V004StringComponents = [
  version: string,
  nonce: string,
  ciphertext: string,
  authenticatedData: string,
  additionalData: string,
]

export type V004Components = {
  version: V004StringComponents[0]
  nonce: V004StringComponents[1]
  ciphertext: V004StringComponents[2]
  authenticatedData: V004StringComponents[3]
  additionalData: V004StringComponents[4]
}

export type V004AsymmetricStringComponents = [
  version: typeof V004AsymmetricCiphertextPrefix,
  nonce: string,
  ciphertext: string,
  additionalData: string,
]

export type V004AsymmetricComponents = {
  version: V004AsymmetricStringComponents[0]
  nonce: V004AsymmetricStringComponents[1]
  ciphertext: V004AsymmetricStringComponents[2]
  additionalData: V004AsymmetricStringComponents[3]
}

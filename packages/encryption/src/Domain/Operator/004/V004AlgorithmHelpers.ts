import { V004Components, V004PartitionCharacter, V004StringComponents } from './V004AlgorithmTypes'

export function doesPayloadRequireSigning(payload: { shared_vault_uuid?: string }) {
  return payload.shared_vault_uuid != undefined
}

export function deconstructEncryptedPayloadString(payloadString: string): V004Components {
  /** Base64 encoding of JSON.stringify({}) */
  const EmptyAdditionalDataString = 'e30='

  const components = payloadString.split(V004PartitionCharacter) as V004StringComponents

  return {
    version: components[0],
    nonce: components[1],
    ciphertext: components[2],
    authenticatedData: components[3],
    additionalData: components[4] ?? EmptyAdditionalDataString,
  }
}

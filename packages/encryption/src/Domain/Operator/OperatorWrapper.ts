import {
  DecryptedPayloadInterface,
  ItemsKeyInterface,
  RootKeyInterface,
  ItemContent,
  EncryptedPayloadInterface,
  KeySystemItemsKeyInterface,
  KeySystemRootKeyInterface,
} from '@standardnotes/models'
import {
  EncryptedOutputParameters,
  encryptedInputParametersFromPayload,
  ErrorDecryptingParameters,
} from '../Types/EncryptedParameters'
import { DecryptedParameters } from '../Types/DecryptedParameters'
import { OperatorManager } from './OperatorManager'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'

export async function encryptPayload(
  payload: DecryptedPayloadInterface,
  key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
  operatorManager: OperatorManager,
  signingKeyPair: PkcKeyPair | undefined,
): Promise<EncryptedOutputParameters> {
  const operator = operatorManager.operatorForVersion(key.keyVersion)
  const encryptionParameters = operator.generateEncryptedParameters(payload, key, signingKeyPair)

  if (!encryptionParameters) {
    throw 'Unable to generate encryption parameters'
  }

  return encryptionParameters
}

export async function decryptPayload<C extends ItemContent = ItemContent>(
  payload: EncryptedPayloadInterface,
  key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
  operatorManager: OperatorManager,
): Promise<DecryptedParameters<C> | ErrorDecryptingParameters> {
  const operator = operatorManager.operatorForVersion(payload.version)

  try {
    return operator.generateDecryptedParameters(encryptedInputParametersFromPayload(payload), key)
  } catch (e) {
    console.error('Error decrypting payload', payload, e)
    return {
      uuid: payload.uuid,
      errorDecrypting: true,
    }
  }
}

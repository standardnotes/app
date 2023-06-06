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
  DecryptedParameters,
  EncryptedParameters,
  encryptedParametersFromPayload,
  ErrorDecryptingParameters,
} from '../Types/EncryptedParameters'
import { isAsyncOperator } from './Functions'
import { OperatorManager } from './OperatorManager'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'

export async function encryptPayload(
  payload: DecryptedPayloadInterface,
  key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
  operatorManager: OperatorManager,
  signingKeyPair?: PkcKeyPair,
): Promise<EncryptedParameters> {
  const operator = operatorManager.operatorForVersion(key.keyVersion)
  let encryptionParameters

  if (isAsyncOperator(operator)) {
    encryptionParameters = await operator.generateEncryptedParametersAsync(payload, key, signingKeyPair)
  } else {
    encryptionParameters = operator.generateEncryptedParametersSync(payload, key, signingKeyPair)
  }

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
    if (isAsyncOperator(operator)) {
      return await operator.generateDecryptedParametersAsync(encryptedParametersFromPayload(payload), key)
    } else {
      return operator.generateDecryptedParametersSync(encryptedParametersFromPayload(payload), key)
    }
  } catch (e) {
    console.error('Error decrypting payload', payload, e)
    return {
      uuid: payload.uuid,
      errorDecrypting: true,
    }
  }
}

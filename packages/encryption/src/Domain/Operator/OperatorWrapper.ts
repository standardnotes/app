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
import { isAsyncOperator } from './OperatorInterface/TypeCheck'

export async function encryptPayload(
  payload: DecryptedPayloadInterface,
  key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
  operatorManager: OperatorManager,
  signingKeyPair: PkcKeyPair | undefined,
): Promise<EncryptedOutputParameters> {
  const operator = operatorManager.operatorForVersion(key.keyVersion)
  let result: EncryptedOutputParameters | undefined = undefined

  if (isAsyncOperator(operator)) {
    result = await operator.generateEncryptedParametersAsync(payload, key)
  } else {
    result = operator.generateEncryptedParameters(payload, key, signingKeyPair)
  }

  if (!result) {
    throw 'Unable to generate encryption parameters'
  }

  return result
}

export async function decryptPayload<C extends ItemContent = ItemContent>(
  payload: EncryptedPayloadInterface,
  key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
  operatorManager: OperatorManager,
): Promise<DecryptedParameters<C> | ErrorDecryptingParameters> {
  const operator = operatorManager.operatorForVersion(payload.version)

  try {
    if (isAsyncOperator(operator)) {
      return await operator.generateDecryptedParametersAsync(encryptedInputParametersFromPayload(payload), key)
    } else {
      return operator.generateDecryptedParameters(encryptedInputParametersFromPayload(payload), key)
    }
  } catch (e) {
    console.error('Error decrypting payload', payload, e)
    return {
      uuid: payload.uuid,
      errorDecrypting: true,
    }
  }
}

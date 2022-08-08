import {
  DecryptedPayloadInterface,
  EncryptedPayloadInterface,
  isDecryptedPayload,
  ItemsKeyContent,
  RootKeyInterface,
} from '@standardnotes/models'
import { EncryptionProvider, KeyRecoveryStrings, SNRootKeyParams } from '@standardnotes/encryption'
import { ChallengeServiceInterface } from '../Challenge/ChallengeServiceInterface'
import { ChallengePrompt } from '../Challenge/Prompt/ChallengePrompt'
import { ChallengeReason } from '../Challenge/Types/ChallengeReason'
import { ChallengeValidation } from '../Challenge/Types/ChallengeValidation'

export async function DecryptItemsKeyWithUserFallback(
  itemsKey: EncryptedPayloadInterface,
  encryptor: EncryptionProvider,
  challengor: ChallengeServiceInterface,
): Promise<DecryptedPayloadInterface<ItemsKeyContent> | 'failed' | 'aborted'> {
  const decryptionResult = await encryptor.decryptSplitSingle<ItemsKeyContent>({
    usesRootKeyWithKeyLookup: {
      items: [itemsKey],
    },
  })

  if (isDecryptedPayload(decryptionResult)) {
    return decryptionResult
  }

  const secondDecryptionResult = await DecryptItemsKeyByPromptingUser(itemsKey, encryptor, challengor)

  if (secondDecryptionResult === 'aborted' || secondDecryptionResult === 'failed') {
    return secondDecryptionResult
  }

  return secondDecryptionResult.decryptedKey
}

export async function DecryptItemsKeyByPromptingUser(
  itemsKey: EncryptedPayloadInterface,
  encryptor: EncryptionProvider,
  challengor: ChallengeServiceInterface,
  keyParams?: SNRootKeyParams,
): Promise<
  | {
      decryptedKey: DecryptedPayloadInterface<ItemsKeyContent>
      rootKey: RootKeyInterface
    }
  | 'failed'
  | 'aborted'
> {
  if (!keyParams) {
    keyParams = encryptor.getKeyEmbeddedKeyParams(itemsKey)
  }

  if (!keyParams) {
    return 'failed'
  }

  const challenge = challengor.createChallenge(
    [new ChallengePrompt(ChallengeValidation.None, undefined, undefined, true)],
    ChallengeReason.Custom,
    true,
    KeyRecoveryStrings.KeyRecoveryLoginFlowPrompt(keyParams),
    KeyRecoveryStrings.KeyRecoveryPasswordRequired,
  )

  const response = await challengor.promptForChallengeResponse(challenge)

  if (!response) {
    return 'aborted'
  }

  const password = response.values[0].value as string

  const rootKey = await encryptor.computeRootKey(password, keyParams)

  const secondDecryptionResult = await encryptor.decryptSplitSingle<ItemsKeyContent>({
    usesRootKey: {
      items: [itemsKey],
      key: rootKey,
    },
  })

  challengor.completeChallenge(challenge)

  if (isDecryptedPayload(secondDecryptionResult)) {
    return { decryptedKey: secondDecryptionResult, rootKey }
  }

  return 'failed'
}

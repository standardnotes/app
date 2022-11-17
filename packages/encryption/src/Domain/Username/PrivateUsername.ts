import { PureCryptoInterface } from '@standardnotes/sncrypto-common'

const PrivateUserNameV1 = 'StandardNotes-PrivateUsername-V1'

export async function ComputePrivateUsername(
  crypto: PureCryptoInterface,
  usernameInput: string,
): Promise<string | undefined> {
  const result = await crypto.hmac256(
    await crypto.sha256(PrivateUserNameV1),
    await crypto.sha256(usernameInput.trim().toLowerCase()),
  )

  if (result == undefined) {
    return undefined
  }

  return result
}

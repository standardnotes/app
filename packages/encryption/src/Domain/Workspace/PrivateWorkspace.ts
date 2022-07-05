import { PureCryptoInterface } from '@standardnotes/sncrypto-common'

export async function ComputePrivateWorkspaceIdentifier(
  crypto: PureCryptoInterface,
  userphrase: string,
  name: string,
): Promise<string | undefined> {
  const identifier = await crypto.hmac256(
    await crypto.sha256(name.trim().toLowerCase()),
    await crypto.sha256(userphrase.trim().toLowerCase()),
  )

  if (identifier == undefined) {
    return undefined
  }

  return identifier
}

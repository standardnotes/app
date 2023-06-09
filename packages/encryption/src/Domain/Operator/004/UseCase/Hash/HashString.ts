import { PureCryptoInterface } from '@standardnotes/sncrypto-common'

export class HashStringUseCase {
  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(_string: string): string {
    throw new Error('Method not implemented.')
  }
}

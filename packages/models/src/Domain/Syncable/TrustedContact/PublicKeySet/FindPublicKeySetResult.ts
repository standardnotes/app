import { ContactPublicKeySetInterface } from './ContactPublicKeySetInterface'

export type FindPublicKeySetResult =
  | {
      publicKeySet: ContactPublicKeySetInterface
      current: boolean
    }
  | undefined

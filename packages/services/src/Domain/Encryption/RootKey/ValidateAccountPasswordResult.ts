import { RootKeyInterface } from '@standardnotes/models'

export type ValidateAccountPasswordResult =
  | {
      valid: true
      artifacts: {
        rootKey: RootKeyInterface
      }
    }
  | {
      valid: boolean
      artifacts?: undefined
    }

import { RootKeyInterface } from '@standardnotes/models'

export type ValidatePasscodeResult =
  | {
      valid: true
      artifacts: {
        wrappingKey: RootKeyInterface
      }
    }
  | {
      valid: boolean
      artifacts?: undefined
    }

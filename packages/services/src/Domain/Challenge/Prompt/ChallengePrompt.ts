import { assertUnreachable } from '@standardnotes/utils'
import { ChallengeKeyboardType } from '../Types/ChallengeKeyboardType'
import { ChallengeRawValue } from '../Types/ChallengeRawValue'
import { ChallengeValidation } from '../Types/ChallengeValidation'
import { ChallengePromptInterface } from './ChallengePromptInterface'
import { ChallengePromptTitle } from './PromptTitles'

/* istanbul ignore file */

export class ChallengePrompt implements ChallengePromptInterface {
  public readonly id = Math.random()
  public readonly placeholder: string
  public readonly title: string
  public readonly validates: boolean

  constructor(
    public readonly validation: ChallengeValidation,
    title?: string,
    placeholder?: string,
    public readonly secureTextEntry = true,
    public readonly keyboardType?: ChallengeKeyboardType,
    public readonly initialValue?: ChallengeRawValue,
    public readonly contextData?: Record<string, unknown>,
  ) {
    switch (this.validation) {
      case ChallengeValidation.AccountPassword:
        this.title = title ?? ChallengePromptTitle.AccountPassword
        this.placeholder = placeholder ?? ChallengePromptTitle.AccountPassword
        this.validates = true
        break
      case ChallengeValidation.LocalPasscode:
        this.title = title ?? ChallengePromptTitle.LocalPasscode
        this.placeholder = placeholder ?? ChallengePromptTitle.LocalPasscode
        this.validates = true
        break
      case ChallengeValidation.Biometric:
        this.title = title ?? ChallengePromptTitle.Biometrics
        this.placeholder = placeholder ?? ''
        this.validates = true
        break
      case ChallengeValidation.Authenticator:
        this.title = title ?? ChallengePromptTitle.U2F
        this.placeholder = placeholder ?? ''
        this.validates = true
        break
      case ChallengeValidation.ProtectionSessionDuration:
        this.title = title ?? ChallengePromptTitle.RememberFor
        this.placeholder = placeholder ?? ''
        this.validates = true
        break
      case ChallengeValidation.None:
        this.title = title ?? ''
        this.placeholder = placeholder ?? ''
        this.validates = false
        break
      default:
        assertUnreachable(this.validation)
    }
    Object.freeze(this)
  }
}

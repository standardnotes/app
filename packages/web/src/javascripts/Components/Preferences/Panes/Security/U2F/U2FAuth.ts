import { MfaProvider } from '@/Components/Preferences/Providers/MfaProvider'
import { UserProvider } from '@/Components/Preferences/Providers/UserProvider'

type U2FStatus = 'u2f-enabled' | 'u2f-disabled'

export const isU2FDisabled = (status: U2FStatus): status is 'u2f-disabled' => status === 'u2f-disabled'

export class U2FAuth {
  private _status: U2FStatus | 'fetching' = 'fetching'
  private _errorMessage: string | null = null

  constructor(private readonly mfaProvider: MfaProvider, private readonly userProvider: UserProvider) {}

  isLoggedIn(): boolean {
    return this.userProvider.getUser() != undefined
  }

  toggle2FA(): void {
    if (!this.isLoggedIn()) {
      return
    }

    if (this._status === 'u2f-disabled') {
      // return this.startActivation()
    }

    if (this._status === 'u2f-enabled') {
      // return this.deactivate2FA()
    }
  }

  get status(): U2FStatus | 'fetching' {
    return this._status
  }

  get errorMessage(): string | null {
    return this._errorMessage
  }
}

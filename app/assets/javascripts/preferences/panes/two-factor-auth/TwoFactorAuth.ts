import { MfaProvider, UserProvider } from '@/preferences/providers';
import { action, makeAutoObservable, observable } from 'mobx';
import { TwoFactorActivation } from './TwoFactorActivation';

type TwoFactorStatus =
  | 'two-factor-enabled'
  | TwoFactorActivation
  | 'two-factor-disabled';

export const is2FADisabled = (status: TwoFactorStatus): status is 'two-factor-disabled' =>
  status === 'two-factor-disabled';

export const is2FAActivation = (status: TwoFactorStatus): status is TwoFactorActivation =>
  (status as TwoFactorActivation)?.type === 'two-factor-activation';

export const is2FAEnabled = (status: TwoFactorStatus): status is 'two-factor-enabled' =>
  status === 'two-factor-enabled';

export class TwoFactorAuth {
  private _status: TwoFactorStatus | 'fetching' = 'fetching';
  private _errorMessage: string | null;

  constructor(
    private readonly mfaProvider: MfaProvider,
    private readonly userProvider: UserProvider
  ) {
    this._errorMessage = null;

    makeAutoObservable<
      TwoFactorAuth,
      '_status' | '_errorMessage' | 'deactivateMfa' | 'startActivation'
    >(this, {
      _status: observable,
      _errorMessage: observable,
      deactivateMfa: action,
      startActivation: action,
    });
  }

  private startActivation(): void {
    const setDisabled = action(() => (this._status = 'two-factor-disabled'));
    const setEnabled = action(() => (this._status = 'two-factor-enabled'));
    this.mfaProvider
      .generateMfaSecret()
      .then(
        action((secret) => {
          this._status = new TwoFactorActivation(
            this.mfaProvider,
            this.userProvider,
            secret,
            setDisabled,
            setEnabled
          );
        })
      )
      .catch(
        action((e) => {
          this.setError(e.message);
        })
      );
  }

  private deactivate2FA(): void {
    this.mfaProvider
      .disableMfa()
      .then(
        action(() => {
          this._status = 'two-factor-disabled';
        })
      )
      .catch(
        action((e) => {
          this.setError(e.message);
        })
      );
  }

  private get isLoggedIn(): boolean {
    return this.userProvider.getUser() != undefined;
  }

  fetchStatus(): void {
    this._status = 'fetching';

    if (!this.isLoggedIn) {
      return;
    }

    if (!this.isMfaFeatureAvailable) {
      return;
    }

    this.mfaProvider
      .isMfaActivated()
      .then(
        action((active) => {
          this._status = active ? 'two-factor-enabled' : 'two-factor-disabled';
          this.setError(null);
        })
      )
      .catch(
        action((e) => {
          this._status = 'two-factor-disabled';
          this.setError(e.message);
        })
      );
  }

  private setError(errorMessage: string | null): void {
    this._errorMessage = errorMessage;
  }

  toggle2FA(): void {
    if (!this.isLoggedIn) {
      return;
    }

    if (!this.isMfaFeatureAvailable) {
      return;
    }

    if (this._status === 'two-factor-disabled') {
      return this.startActivation();
    }

    if (this._status === 'two-factor-enabled') {
      return this.deactivate2FA();
    }
  }

  get errorMessage(): string | null {
    if (!this.isLoggedIn) {
      return 'Two-factor authentication not available / Sign in or register for an account to configure 2FA';
    }
    if (!this.isMfaFeatureAvailable) {
      return 'Two-factor authentication not available / A paid subscription plan is required to enable 2FA.';
    }
    return this._errorMessage;
  }

  get status(): TwoFactorStatus {
    if (this._status === 'fetching') {
      return 'two-factor-disabled';
    }
    return this._status;
  }

  private get isMfaFeatureAvailable(): boolean {
    return this.mfaProvider.isMfaFeatureAvailable();
  }
}

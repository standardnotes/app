import { action, makeAutoObservable, observable } from 'mobx';
import { MfaGateway } from './MfaProps';
import { TwoFactorActivation } from './TwoFactorActivation';

type TwoFactorStatus =
  | 'two-factor-enabled'
  | TwoFactorActivation
  | 'two-factor-disabled';

export const is2FADisabled = (s: TwoFactorStatus): s is 'two-factor-disabled' =>
  s === 'two-factor-disabled';

export const is2FAActivation = (s: TwoFactorStatus): s is TwoFactorActivation =>
  (s as any).type === 'two-factor-activation';

export const is2FAEnabled = (s: TwoFactorStatus): s is 'two-factor-enabled' =>
  s === 'two-factor-enabled';

export class TwoFactorAuth {
  private _status: TwoFactorStatus | 'fetching' = 'fetching';
  private _errorMessage: string | null;

  constructor(private readonly mfaGateway: MfaGateway) {
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

  private startActivation() {
    const setDisabled = action(() => (this._status = 'two-factor-disabled'));
    const setEnabled = action(() => (this._status = 'two-factor-enabled'));
    this.mfaGateway
      .generateMfaSecret()
      .then(
        action((secret) => {
          this._status = new TwoFactorActivation(
            this.mfaGateway,
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

  private deactivate2FA() {
    this.mfaGateway
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

  private get isLoggedIn() {
    return this.mfaGateway.getUser() != undefined;
  }

  fetchStatus() {
    this._status = 'fetching';

    if (!this.isLoggedIn) {
      this.setError('To enable 2FA, sign in or register for an account.');
      return;
    }

    this.mfaGateway
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

  setError(errorMessage: string | null) {
    this._errorMessage = errorMessage;
  }

  toggle2FA() {
    if (!this.isLoggedIn) return;
    if (this._status === 'two-factor-disabled') return this.startActivation();
    if (this._status === 'two-factor-enabled') return this.deactivate2FA();
  }

  get errorMessage(): string | null {
    return this._errorMessage;
  }

  get status(): TwoFactorStatus {
    if (this._status === 'fetching') return 'two-factor-disabled';
    return this._status;
  }
}

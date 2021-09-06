import { action, makeAutoObservable, observable, untracked } from 'mobx';
import { MfaGateway } from './MfaProps';

type ActivationStep = 'scan-qr-code' | 'save-secret-key' | 'verification';
type VerificationStatus = 'none' | 'invalid' | 'valid';

export class TwoFactorActivation {
  public readonly type = 'two-factor-activation' as const;

  private _activationStep: ActivationStep;

  private _2FAVerification: VerificationStatus = 'none';

  private inputSecretKey = '';
  private inputOtpToken = '';

  constructor(
    private mfaGateway: MfaGateway,
    private readonly _secretKey: string,
    private _cancelActivation: () => void,
    private _enabled2FA: () => void
  ) {
    this._activationStep = 'scan-qr-code';

    makeAutoObservable<
      TwoFactorActivation,
      | '_secretKey'
      | '_authCode'
      | '_step'
      | '_enable2FAVerification'
      | 'refreshOtp'
      | 'inputOtpToken'
      | 'inputSecretKey'
    >(
      this,
      {
        _secretKey: observable,
        _authCode: observable,
        _step: observable,
        _enable2FAVerification: observable,
        refreshOtp: action,
        inputOtpToken: observable,
        inputSecretKey: observable,
      },
      { autoBind: true }
    );
  }

  get secretKey(): string {
    return this._secretKey;
  }

  get activationStep(): ActivationStep {
    return this._activationStep;
  }

  get verificationStatus(): VerificationStatus {
    return this._2FAVerification;
  }

  get qrCode(): string {
    const email = this.mfaGateway.getUser()!.email;
    return `otpauth://totp/2FA?secret=${this._secretKey}&issuer=Standard%20Notes&label=${email}`;
  }

  cancelActivation(): void {
    this._cancelActivation();
  }

  openScanQRCode(): void {
    const preconditions: ActivationStep[] = ['save-secret-key'];
    if (preconditions.includes(this._activationStep)) {
      this._activationStep = 'scan-qr-code';
    }
  }

  openSaveSecretKey(): void {
    const preconditions: ActivationStep[] = ['scan-qr-code', 'verification'];
    if (preconditions.includes(this._activationStep)) {
      this._activationStep = 'save-secret-key';
    }
  }

  openVerification(): void {
    this.inputOtpToken = '';
    this.inputSecretKey = '';
    const preconditions: ActivationStep[] = ['save-secret-key'];
    if (preconditions.includes(this._activationStep)) {
      this._activationStep = 'verification';
      this._2FAVerification = 'none';
    }
  }

  setInputSecretKey(secretKey: string): void {
    this.inputSecretKey = secretKey;
  }

  setInputOtpToken(otpToken: string): void {
    this.inputOtpToken = otpToken;
  }

  enable2FA(): void {
    if (this.inputSecretKey === this._secretKey) {
      this.mfaGateway
        .enableMfa(this.inputSecretKey, this.inputOtpToken)
        .then(
          action(() => {
            this._2FAVerification = 'valid';
            this._enabled2FA();
          })
        )
        .catch(
          action(() => {
            this._2FAVerification = 'invalid';
          })
        );
    } else {
      this._2FAVerification = 'invalid';
    }
  }
}

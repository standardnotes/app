import { MfaProvider } from '../../providers';
import { action, makeAutoObservable, observable } from 'mobx';

type ActivationStep =
  | 'scan-qr-code'
  | 'save-secret-key'
  | 'verification'
  | 'success';
type VerificationStatus =
  | 'none'
  | 'invalid-auth-code'
  | 'invalid-secret'
  | 'valid';

export class TwoFactorActivation {
  public readonly type = 'two-factor-activation' as const;

  private _activationStep: ActivationStep;

  private _2FAVerification: VerificationStatus = 'none';

  private inputSecretKey = '';
  private inputOtpToken = '';

  constructor(
    private mfaProvider: MfaProvider,
    private readonly email: string,
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
      | 'inputOtpToken'
      | 'inputSecretKey'
    >(
      this,
      {
        _secretKey: observable,
        _authCode: observable,
        _step: observable,
        _enable2FAVerification: observable,
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
    return `otpauth://totp/2FA?secret=${this._secretKey}&issuer=Standard%20Notes&label=${this.email}`;
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

  openSuccess(): void {
    if (this._activationStep === 'verification') {
      this._activationStep = 'success';
    }
  }

  setInputSecretKey(secretKey: string): void {
    this.inputSecretKey = secretKey;
  }

  setInputOtpToken(otpToken: string): void {
    this.inputOtpToken = otpToken;
  }

  enable2FA(): void {
    if (this.inputSecretKey !== this._secretKey) {
      this._2FAVerification = 'invalid-secret';
      return;
    }

    this.mfaProvider
      .enableMfa(this.inputSecretKey, this.inputOtpToken)
      .then(
        action(() => {
          this._2FAVerification = 'valid';
          this.openSuccess();
        })
      )
      .catch(
        action(() => {
          this._2FAVerification = 'invalid-auth-code';
        })
      );
  }

  finishActivation(): void {
    if (this._activationStep === 'success') {
      this._enabled2FA();
    }
  }
}

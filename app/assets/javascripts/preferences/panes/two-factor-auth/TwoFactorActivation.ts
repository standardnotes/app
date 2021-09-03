import { action, makeAutoObservable, observable, untracked } from 'mobx';
import { MfaGateway } from './MfaProps';

const activationSteps = [
  'scan-qr-code',
  'save-secret-key',
  'verification',
] as const;

type ActivationStep = typeof activationSteps[number];

export class TwoFactorActivation {
  public readonly type = 'two-factor-activation' as const;

  private _activationStep: ActivationStep;

  private _2FAVerification: 'none' | 'invalid' | 'valid' = 'none';

  private inputSecretKey: string = '';
  private inputOtpToken: string = '';

  constructor(
    private mfa: MfaGateway,
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

  get secretKey() {
    return this._secretKey;
  }

  get activationStep() {
    return this._activationStep;
  }

  get verificationStatus() {
    return this._2FAVerification;
  }

  get qrCode() {
    return `otpauth://totp/2FA?secret=${this._secretKey}&issuer=Standard%20Notes`;
  }

  cancelActivation() {
    this._cancelActivation();
  }

  openScanQRCode() {
    const preconditions: ActivationStep[] = ['save-secret-key'];
    if (preconditions.includes(this._activationStep)) {
      this._activationStep = 'scan-qr-code';
    }
  }

  openSaveSecretKey() {
    const preconditions: ActivationStep[] = ['scan-qr-code', 'verification'];
    if (preconditions.includes(this._activationStep)) {
      this._activationStep = 'save-secret-key';
    }
  }

  openVerification() {
    this.inputOtpToken = '';
    this.inputSecretKey = '';
    const preconditions: ActivationStep[] = ['save-secret-key'];
    if (preconditions.includes(this._activationStep)) {
      this._activationStep = 'verification';
      this._2FAVerification = 'none';
    }
  }

  setInputSecretKey(secretKey: string) {
    this.inputSecretKey = secretKey;
  }

  setInputOtpToken(otpToken: string) {
    this.inputOtpToken = otpToken;
  }

  enable2FA() {
    if (this.inputSecretKey === this._secretKey) {
      console.log('oh no');
      this.mfa
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

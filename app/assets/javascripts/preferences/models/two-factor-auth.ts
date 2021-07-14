import { makeAutoObservable, observable } from 'mobx';

function getNewAuthCode() {
  const MIN = 100000;
  const MAX = 999999;
  const code = Math.floor(Math.random() * (MAX - MIN) + MIN);
  return code.toString();
}

class TwoFactorData {
  private _secretKey: string;
  private _authCode: string;

  constructor(secretKey: string) {
    this._secretKey = secretKey;
    this._authCode = getNewAuthCode();
    makeAutoObservable<TwoFactorData, '_secretKey' | '_authCode'>(
      this,
      {
        _secretKey: observable,
        _authCode: observable,
      },
      { autoBind: true }
    );
  }

  get secretKey() {
    return this._secretKey;
  }

  get authCode() {
    return this._authCode;
  }

  refreshAuthCode() {
    this._authCode = getNewAuthCode();
  }
}

type TwoFactorStatus = 'enabled' | 'disabled';

export class TwoFactorAuth {
  private _twoFactorStatus: TwoFactorStatus = 'disabled';
  private _twoFactorData: TwoFactorData | null = null;

  constructor() {
    makeAutoObservable<TwoFactorAuth, '_twoFactorStatus' | '_twoFactorData'>(
      this,
      {
        _twoFactorStatus: observable,
        _twoFactorData: observable,
      },
      { autoBind: true }
    );
  }

  private activate2FA() {
    this._twoFactorData = new TwoFactorData('FHJJSAJKDASKW43KJS');
    this._twoFactorStatus = 'enabled';
  }

  private deactivate2FA() {
    this._twoFactorData = null;
    this._twoFactorStatus = 'disabled';
  }

  toggle2FA() {
    if (this._twoFactorStatus === 'enabled') this.deactivate2FA();
    else this.activate2FA();
  }

  get twoFactorStatus() {
    return this._twoFactorStatus;
  }

  get twoFactorData() {
    if (this._twoFactorStatus !== 'enabled')
      throw new Error(`Can't provide 2FA data if not enabled`);
    return this._twoFactorData;
  }
}

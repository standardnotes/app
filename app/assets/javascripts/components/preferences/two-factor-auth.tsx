import { FunctionalComponent } from 'preact';
import { PreferencesGroup, PreferencesSegment } from './pane';
import { Title, Text } from './content';
import { Switch } from '../Switch';
import {
  action,
  computed,
  makeAutoObservable,
  observable,
  runInAction,
  toJS,
} from 'mobx';
import { useEffect, useState } from 'preact/hooks';
import { observer } from 'mobx-react-lite';
import { DecoratedInput } from '../DecoratedInput';
import { IconButton } from '../IconButton';

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
    makeAutoObservable<TwoFactorData, '_secretKey' | '_authCode'>(this, {
      _secretKey: observable,
      _authCode: observable,
    });
    this._secretKey = secretKey;
    this._authCode = getNewAuthCode();
  }

  get secretKey() {
    return this._secretKey;
  }

  get authCode() {
    return this._authCode;
  }

  refreshAuthCode() {
    this._authCode = getNewAuthCode();
    console.log('deep refresh', this._authCode);
  }
}

type TwoFactorStatus = 'enabled' | 'disabled' | 'fetching';

class TwoFactorAuth {
  private _twoFactorStatus: TwoFactorStatus = 'fetching';
  private _twoFactorData: TwoFactorData | null = null;

  constructor() {
    makeAutoObservable<TwoFactorAuth, '_twoFactorStatus' | '_twoFactorData'>(
      this,
      {
        _twoFactorStatus: observable,
        _twoFactorData: observable,
      }
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

  refreshAuthCode() {
    if (this._twoFactorStatus === 'enabled') {
      this._twoFactorData?.refreshAuthCode();
    }
  }
}

export const TwoFactorAuthentication: FunctionalComponent = observer(() => {
  const [state] = useState(() => new TwoFactorAuth());
  // useEffect(() => {
  //   const handle = setInterval(() => {
  //     state.refreshAuthCode();
  //   }, 1000);
  //   return () => {
  //     clearInterval(handle);
  //   };
  // }, [state]);
  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <div className="flex flex-row items-center">
          <div className="flex-grow flex flex-col">
            <Title>Two-factor authentication</Title>
            <Text>
              An extra layer of security when logging in to your account.
            </Text>
          </div>
          <Switch
            checked={state.twoFactorStatus === 'enabled'}
            onChange={() => state.toggle2FA()}
          />
        </div>
      </PreferencesSegment>
      <PreferencesSegment>
        {state.twoFactorStatus === 'enabled' ? (
          <TwoFactorEnabled state={state} />
        ) : (
          <TwoFactorDisabled />
        )}
      </PreferencesSegment>
    </PreferencesGroup>
  );
});

const TwoFactorEnabled: FunctionalComponent<{ state: TwoFactorAuth }> =
  observer(({ state }) => {
    const download = (
      <IconButton
        icon="download"
        onClick={() => {
          state.refreshAuthCode();
        }}
      />
    );
    const copy = (
      <IconButton
        icon="copy"
        onClick={() => {
          if (state.twoFactorData != null)
            navigator?.clipboard?.writeText(state.twoFactorData.secretKey);
        }}
      />
    );
    const spinner = <div class="sk-spinner info w-8 h-3.5" />;
    return (
      <div className="flex flex-row gap-4">
        <div className="flex-grow flex flex-col">
          <Text>Secret Key</Text>
          <DecoratedInput
            disabled={true}
            right={[copy, download]}
            text={state.twoFactorData?.secretKey}
          />
        </div>
        <div className="w-30 flex flex-col">
          <Text>Authentication Code</Text>
          <DecoratedInput
            disabled={true}
            text={state.twoFactorData?.authCode}
            right={[spinner]}
          />
        </div>
      </div>
    );
  });

const TwoFactorDisabled: FunctionalComponent = () => (
  <Text>
    Enabling two-factor authentication will sign you out of all other sessions.{' '}
    <a
      target="_blank"
      href="https://standardnotes.com/help/21/where-should-i-store-my-two-factor-authentication-secret-key"
    >
      Learn more
    </a>
  </Text>
);

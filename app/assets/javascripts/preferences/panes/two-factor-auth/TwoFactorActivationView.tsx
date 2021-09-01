import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { TwoFactorActivation } from './model';
import { SaveSecretKey } from './SaveSecretKey';
import { ScanQRCode } from './ScanQRCode';
import { Verification } from './Verification';

export const TwoFactorActivationView: FunctionComponent<{
  activation: TwoFactorActivation;
}> = observer(({ activation: act }) => (
  <>
    {act.step === 'scan-qr-code' && <ScanQRCode activation={act} />}

    {act.step === 'save-secret-key' && <SaveSecretKey activation={act} />}

    {act.step === 'verification' && <Verification activation={act} />}
  </>
));

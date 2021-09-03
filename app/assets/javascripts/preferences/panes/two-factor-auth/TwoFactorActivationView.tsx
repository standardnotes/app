import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { TwoFactorActivation } from './TwoFactorActivation';
import { SaveSecretKey } from './SaveSecretKey';
import { ScanQRCode } from './ScanQRCode';
import { Verification } from './Verification';

export const TwoFactorActivationView: FunctionComponent<{
  activation: TwoFactorActivation;
}> = observer(({ activation: act }) => (
  <>
    {act.activationStep === 'scan-qr-code' && <ScanQRCode activation={act} />}

    {act.activationStep === 'save-secret-key' && (
      <SaveSecretKey activation={act} />
    )}

    {act.activationStep === 'verification' && <Verification activation={act} />}
  </>
));

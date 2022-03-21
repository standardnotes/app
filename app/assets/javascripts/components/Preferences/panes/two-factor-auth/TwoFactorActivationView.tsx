import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { TwoFactorActivation } from './TwoFactorActivation';
import { SaveSecretKey } from './SaveSecretKey';
import { ScanQRCode } from './ScanQRCode';
import { Verification } from './Verification';
import { TwoFactorSuccess } from './TwoFactorSuccess';

export const TwoFactorActivationView: FunctionComponent<{
  activation: TwoFactorActivation;
}> = observer(({ activation: act }) => {
  switch (act.activationStep) {
    case 'scan-qr-code':
      return <ScanQRCode activation={act} />;
    case 'save-secret-key':
      return <SaveSecretKey activation={act} />;
    case 'verification':
      return <Verification activation={act} />;
    case 'success':
      return <TwoFactorSuccess activation={act} />;
  }
});

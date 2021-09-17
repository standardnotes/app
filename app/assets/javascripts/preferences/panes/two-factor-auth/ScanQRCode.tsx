import { FunctionComponent } from 'preact';
import { observer } from 'mobx-react-lite';

import QRCode from 'qrcode.react';

import { DecoratedInput } from '@/components/DecoratedInput';
import { Button } from '@/components/Button';
import { TwoFactorActivation } from './TwoFactorActivation';
import { AuthAppInfoTooltip } from './AuthAppInfoPopup';
import {
  ModalDialog,
  ModalDialogButtons,
  ModalDialogDescription,
  ModalDialogLabel,
} from '@/components/shared/ModalDialog';
import { CopyButton } from './CopyButton';
import { Bullet } from './Bullet';

export const ScanQRCode: FunctionComponent<{
  activation: TwoFactorActivation;
}> = observer(({ activation: act }) => {
  return (
    <ModalDialog>
      <ModalDialogLabel closeDialog={act.cancelActivation}>
        Step 1 of 3 - Scan QR code
      </ModalDialogLabel>
      <ModalDialogDescription>
        <div className="w-25 h-25 flex items-center justify-center bg-info">
          <QRCode value={act.qrCode} size={100} />
        </div>
        <div className="min-w-3" />
        <div className="flex-grow flex flex-col">
          <div className="flex flex-row items-center">
            <Bullet />
            <div className="min-w-1" />
            <div className="text-sm">
              Open your <b>authenticator app</b>.
            </div>
            <div className="min-w-2" />
            <AuthAppInfoTooltip />
          </div>
          <div className="min-h-2" />
          <div className="flex flex-row items-center">
            <Bullet className="self-start mt-2" />
            <div className="min-w-1" />
            <div className="text-sm flex-grow">
              <b>Scan this QR code</b> or <b>add this secret key</b>:
            </div>
          </div>
          <div className="min-h-2" />
          <DecoratedInput
            className="ml-4 w-90"
            disabled={true}
            text={act.secretKey}
            right={[<CopyButton copyValue={act.secretKey} />]}
          />
        </div>
      </ModalDialogDescription>
      <ModalDialogButtons>
        <Button
          className="min-w-20"
          type="normal"
          label="Cancel"
          onClick={() => act.cancelActivation()}
        />
        <Button
          className="min-w-20"
          type="primary"
          label="Next"
          onClick={() => act.openSaveSecretKey()}
        />
      </ModalDialogButtons>
    </ModalDialog>
  );
});

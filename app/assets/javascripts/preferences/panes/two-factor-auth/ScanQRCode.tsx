import { FunctionComponent } from 'preact';
import { observer } from 'mobx-react-lite';

import QRCode from 'qrcode.react';

import { DecoratedInput } from '@/components/DecoratedInput';
import { IconButton } from '@/components/IconButton';
import { Button } from '@/components/Button';
import { TwoFactorActivation } from './TwoFactorActivation';
import { AuthAppInfoTooltip } from './AuthAppInfoPopup';
import {
  ModalDialog,
  ModalDialogButtons,
  ModalDialogDescription,
  ModalDialogLabel
} from '@/components/shared/ModalDialog';

export const ScanQRCode: FunctionComponent<{
  activation: TwoFactorActivation;
}> = observer(({ activation: act }) => {
  const copy = (
    <IconButton
      icon="copy"
      onClick={() => {
        navigator?.clipboard?.writeText(act.secretKey);
      }}
    />
  );
  return (
    <ModalDialog>
      <ModalDialogLabel
        closeDialog={() => {
          act.cancelActivation();
        }}
      >
        Step 1 of 3 - Scan QR code
      </ModalDialogLabel>
      <ModalDialogDescription>
        <div className="flex flex-row gap-3 items-center">
          <div className="w-25 h-25 flex items-center justify-center bg-info">
            <QRCode value={act.qrCode} size={100} />
          </div>
          <div className="flex-grow flex flex-col gap-2">
            <div className="flex flex-row gap-1 items-center">
              <div className="text-sm">
                ・Open your <b>authenticator app</b>.
              </div>
              <AuthAppInfoTooltip />
            </div>
            <div className="flex flex-row items-center">
              <div className="text-sm flex-grow">
                ・<b>Scan this QR code</b> or <b>add this secret key</b>:
              </div>
              <div className="w-56">
                <DecoratedInput
                  disabled={true}
                  text={act.secretKey}
                  right={[copy]}
                />
              </div>
            </div>
          </div>
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

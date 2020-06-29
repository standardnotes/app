/* eslint-disable prefer-promise-reject-errors */
import { SNAlertService } from 'snjs';
import { SKAlert } from 'sn-stylekit';

/** @returns a promise resolving to true if the user confirmed, false if they canceled */
export function confirmDialog({
  text,
  title,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  confirmButtonStyle = 'info'
}: {
  text: string,
  title?: string,
  confirmButtonText?: string,
  cancelButtonText?: string,
  confirmButtonStyle?: 'danger' | 'info'
}) {
  return new Promise<boolean>((resolve) => {
    const alert = new SKAlert({
      title,
      text,
      buttons: [
        {
          text: cancelButtonText,
          style: 'neutral',
          action() {
            resolve(false);
          },
        },
        {
          text: confirmButtonText,
          style: confirmButtonStyle,
          action() {
            resolve(true);
          },
        },
      ],
    });
    alert.present();
  });
}

export class AlertService extends SNAlertService {
  async alert(
    text: string,
    title: string,
    closeButtonText = 'OK',
    onClose: () => void
  ) {
    return new Promise((resolve) => {
      const buttons = [
        {
          text: closeButtonText,
          style: 'neutral',
          action: async () => {
            if (onClose) {
              this.deviceInterface!.timeout(onClose);
            }
            resolve(true);
          },
        },
      ];
      const alert = new SKAlert({ title, text, buttons });
      alert.present();
    });
  }

  /** @deprecated use confirmDialog instead */
  async confirm(
    text: string,
    title: string,
    confirmButtonText = 'Confirm',
    cancelButtonText = 'Cancel',
    onConfirm: () => void,
    onCancel: () => void,
    destructive = false
  ) {
    const confirmed = await confirmDialog({
      text,
      title,
      confirmButtonText,
      cancelButtonText,
      confirmButtonStyle: destructive ? 'danger' : 'info'
    });
    if (confirmed) {
      onConfirm();
    } else {
      onCancel();
    }
    return confirmed;
  }
}

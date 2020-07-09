/* eslint-disable prefer-promise-reject-errors */
import { SNAlertService, ButtonType, DismissBlockingDialog } from 'snjs';
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

export class AlertService implements SNAlertService {
  alert(
    text: string,
    title: string,
    closeButtonText = 'OK',
  ) {
    return new Promise<void>((resolve) => {
      const alert = new SKAlert({
        title,
        text,
        buttons: [{
          text: closeButtonText,
          style: 'neutral',
          action: resolve,
        }],
      });
      alert.present();
    });
  }

  confirm(
    text: string,
    title?: string,
    confirmButtonText?: string,
    confirmButtonType?: ButtonType,
    cancelButtonText?: string
  ): Promise<boolean> {
    return confirmDialog({
      text,
      title,
      confirmButtonText,
      cancelButtonText,
      confirmButtonStyle: confirmButtonType === ButtonType.Danger ? 'danger' : 'info'
    });
  }

  blockingDialog(text: string) {
    const alert = new SKAlert({ text });
    alert.present();
    return () => {
      alert.dismiss();
    };
  }
}

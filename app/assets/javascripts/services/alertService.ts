/* eslint-disable prefer-promise-reject-errors */
import {
  SNAlertService,
  ButtonType,
  sanitizeHtmlString,
} from '@standardnotes/snjs';
import { SKAlert } from 'sn-stylekit';

/** @returns a promise resolving to true if the user confirmed, false if they canceled */
export function confirmDialog({
  text,
  title,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  confirmButtonStyle = 'info',
}: {
  text: string;
  title?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonStyle?: 'danger' | 'info';
}) {
  return new Promise<boolean>((resolve) => {
    const alert = new SKAlert({
      title: title && sanitizeHtmlString(title),
      text: sanitizeHtmlString(text),
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

export function alertDialog({
  title,
  text,
  closeButtonText = 'OK',
}: {
  title?: string;
  text: string;
  closeButtonText?: string;
}) {
  return new Promise<void>((resolve) => {
    const alert = new SKAlert({
      title: title && sanitizeHtmlString(title),
      text: sanitizeHtmlString(text),
      buttons: [
        {
          text: closeButtonText,
          style: 'neutral',
          action: resolve,
        },
      ],
    });
    alert.present();
  });
}

export class AlertService implements SNAlertService {
  /**
   * @deprecated use the standalone `alertDialog` function instead
   */
  alert(text: string, title?: string, closeButtonText?: string) {
    return alertDialog({ text, title, closeButtonText });
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
      confirmButtonStyle:
        confirmButtonType === ButtonType.Danger ? 'danger' : 'info',
    });
  }

  blockingDialog(text: string, title?: string) {
    const alert = new SKAlert({
      title: title && sanitizeHtmlString(title),
      text: sanitizeHtmlString(text),
    });
    alert.present();
    return () => {
      alert.dismiss();
    };
  }
}

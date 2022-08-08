import { AlertService, ButtonType } from '@standardnotes/services'
import { sanitizeHtmlString } from '@standardnotes/utils'
import { SKAlert } from '@standardnotes/styles'
import { alertDialog, confirmDialog } from './Functions'

export class WebAlertService extends AlertService {
  alert(text: string, title?: string, closeButtonText?: string) {
    return alertDialog({ text, title, closeButtonText })
  }

  confirm(
    text: string,
    title?: string,
    confirmButtonText?: string,
    confirmButtonType?: ButtonType,
    cancelButtonText?: string,
  ): Promise<boolean> {
    return confirmDialog({
      text,
      title,
      confirmButtonText,
      cancelButtonText,
      confirmButtonStyle: confirmButtonType === ButtonType.Danger ? 'danger' : 'info',
    })
  }

  blockingDialog(text: string, title?: string) {
    const alert = new SKAlert({
      title: title && sanitizeHtmlString(title),
      text: sanitizeHtmlString(text),
      buttons: [],
    })
    alert.present()
    return () => {
      alert.dismiss()
    }
  }
}

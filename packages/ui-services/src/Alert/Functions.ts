import { sanitizeHtmlString } from '@standardnotes/utils'
import { SKAlert } from '@standardnotes/styles'
import { c } from 'ttag'

/** @returns a promise resolving to true if the user confirmed, false if they canceled */
export function confirmDialog({
  text,
  title,
  confirmButtonText = c('B2.NavSharedUI.Action').t`Confirm`,
  cancelButtonText = c('B2.NavSharedUI.Action').t`Cancel`,
  confirmButtonStyle = 'info',
}: {
  text: string
  title?: string
  confirmButtonText?: string
  cancelButtonText?: string
  confirmButtonStyle?: 'danger' | 'info'
}) {
  return new Promise<boolean>((resolve) => {
    const alert = new SKAlert({
      title: title && sanitizeHtmlString(title),
      text: sanitizeHtmlString(text),
      buttons: [
        {
          text: cancelButtonText,
          style: 'default',
          action() {
            resolve(false)
          },
        },
        {
          text: confirmButtonText,
          style: confirmButtonStyle,
          primary: true,
          action() {
            resolve(true)
          },
        },
      ],
    })
    alert.present()
  })
}

export function alertDialog({
  title,
  text,
  closeButtonText = c('B2.NavSharedUI.Action').t`OK`,
}: {
  title?: string
  text: string
  closeButtonText?: string
}) {
  return new Promise<void>((resolve) => {
    const alert = new SKAlert({
      title: title && sanitizeHtmlString(title),
      text: sanitizeHtmlString(text),
      buttons: [
        {
          text: closeButtonText,
          style: 'default',
          action: resolve,
        },
      ],
    })
    alert.present()
  })
}

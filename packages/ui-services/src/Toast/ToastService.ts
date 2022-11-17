import { addToast, dismissToast, ToastType } from '@standardnotes/toast'

import { ToastServiceInterface } from './ToastServiceInterface'

export class ToastService implements ToastServiceInterface {
  hideToast(toastId: string): void {
    dismissToast(toastId)
  }

  showToast(type: ToastType, message: string): string {
    return addToast({
      type: type,
      message,
    })
  }
}

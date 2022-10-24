import { addToast, ToastType } from '@standardnotes/toast'

import { ToastServiceInterface } from './ToastServiceInterface'

export class ToastService implements ToastServiceInterface {
  showToast(type: ToastType, message: string): void {
    addToast({
      type: type,
      message,
    })
  }
}

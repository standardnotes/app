import { ToastType } from '@standardnotes/toast'

export interface ToastServiceInterface {
  showToast(type: ToastType, message: string): string
  hideToast(toastId: string): void
}

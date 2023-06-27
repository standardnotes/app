import { ClientDisplayableError } from '@standardnotes/responses'

/* istanbul ignore file */

export enum ButtonType {
  Info = 0,
  Danger = 1,
}

export type DismissBlockingDialog = () => void

export abstract class AlertService {
  abstract confirm(
    text: string,
    title?: string,
    confirmButtonText?: string,
    confirmButtonType?: ButtonType,
    cancelButtonText?: string,
  ): Promise<boolean>

  abstract confirmV2(dto: {
    text: string
    title?: string
    confirmButtonText?: string
    confirmButtonType?: ButtonType
    cancelButtonText?: string
  }): Promise<boolean>

  abstract alert(text: string, title?: string, closeButtonText?: string): Promise<void>

  abstract alertV2(dto: { text: string; title?: string; closeButtonText?: string }): Promise<void>

  abstract blockingDialog(text: string, title?: string): DismissBlockingDialog | Promise<DismissBlockingDialog>

  showErrorAlert(error: ClientDisplayableError): Promise<void> {
    return this.alert(error.text, error.title)
  }
}

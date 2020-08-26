import { SNAlertService, ButtonType } from 'snjs';
/** @returns a promise resolving to true if the user confirmed, false if they canceled */
export declare function confirmDialog({ text, title, confirmButtonText, cancelButtonText, confirmButtonStyle, }: {
    text: string;
    title?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonStyle?: 'danger' | 'info';
}): Promise<boolean>;
export declare function alertDialog({ title, text, closeButtonText, }: {
    title?: string;
    text: string;
    closeButtonText?: string;
}): Promise<void>;
export declare class AlertService implements SNAlertService {
    /**
     * @deprecated use the standalone `alertDialog` function instead
     */
    alert(text: string, title?: string, closeButtonText?: string): Promise<void>;
    confirm(text: string, title?: string, confirmButtonText?: string, confirmButtonType?: ButtonType, cancelButtonText?: string): Promise<boolean>;
    blockingDialog(text: string): () => void;
}

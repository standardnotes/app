import { SNAlertService } from 'snjs';
export declare class AlertService extends SNAlertService {
    alert(text: string, title: string, closeButtonText: string | undefined, onClose: () => void): Promise<unknown>;
    confirm(text: string, title: string, confirmButtonText: string | undefined, cancelButtonText: string | undefined, onConfirm: () => void, onCancel: () => void, destructive?: boolean): Promise<unknown>;
}

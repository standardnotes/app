import { SNAlertService } from 'snjs';
export declare class AlertService extends SNAlertService {
    alert(title: string, text: string, closeButtonText: string | undefined, onClose: () => void): Promise<unknown>;
    confirm(title: string, text: string, confirmButtonText: string | undefined, cancelButtonText: string | undefined, onConfirm: () => void, onCancel: () => void, destructive?: boolean): Promise<unknown>;
}

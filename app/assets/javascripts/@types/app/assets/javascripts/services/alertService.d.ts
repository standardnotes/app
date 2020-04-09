export class AlertService extends SNAlertService {
    constructor(deviceInterface: import("../../../../../snjs/dist/@types").DeviceInterface);
    alert(title: any, text: any, closeButtonText?: string, onClose: any): Promise<any>;
    confirm(title: any, text: any, confirmButtonText?: string, cancelButtonText?: string, onConfirm: any, onCancel: any, destructive?: boolean): Promise<any>;
}
import { SNAlertService } from "../../../../../snjs/dist/@types";

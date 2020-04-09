export class StatusManager {
    statuses: any[];
    observers: any[];
    statusFromString(string: any): {
        string: any;
    };
    replaceStatusWithString(status: any, string: any): any;
    addStatusFromString(string: any): any;
    addStatus(status: any): any;
    removeStatus(status: any): null;
    getStatusString(): string;
    notifyObservers(): void;
    addStatusObserver(callback: any): void;
    removeStatusObserver(callback: any): void;
}

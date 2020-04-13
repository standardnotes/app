import { FooterStatus } from './../types';
declare type StatusCallback = (string: string) => void;
export declare class StatusManager {
    private statuses;
    private observers;
    statusFromString(string: string): {
        string: string;
    };
    replaceStatusWithString(status: FooterStatus, string: string): FooterStatus;
    addStatusFromString(string: string): FooterStatus;
    addStatus(status: FooterStatus): FooterStatus;
    removeStatus(status: FooterStatus): undefined;
    getStatusString(): string;
    notifyObservers(): void;
    addStatusObserver(callback: StatusCallback): () => void;
}
export {};

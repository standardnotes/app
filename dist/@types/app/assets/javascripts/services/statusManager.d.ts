import { FooterStatus } from '@/types';
declare type StatusCallback = (string: string) => void;
export declare class StatusManager {
    private statuses;
    private observers;
    replaceStatusWithString(status: FooterStatus, string: string): {
        string: string;
    };
    addStatusFromString(string: string): {
        string: string;
    };
    removeStatus(status: FooterStatus): undefined;
    addStatusObserver(callback: StatusCallback): () => void;
    private notifyObservers;
    private getStatusString;
}
export {};

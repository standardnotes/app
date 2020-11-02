declare type StatusCallback = (string: string) => void;
export declare class StatusManager {
    private _message;
    private observers;
    get message(): string;
    setMessage(message: string): void;
    onStatusChange(callback: StatusCallback): () => void;
    private notifyObservers;
}
export {};

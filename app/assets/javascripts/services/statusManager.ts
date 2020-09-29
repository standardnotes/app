import { removeFromArray } from 'snjs';

type StatusCallback = (string: string) => void;

export class StatusManager {
  private _message = '';
  private observers: StatusCallback[] = [];

  get message(): string {
    return this._message;
  }

  setMessage(message: string) {
    this._message = message;
    this.notifyObservers();
  }

  onStatusChange(callback: StatusCallback) {
    this.observers.push(callback);
    return () => {
      removeFromArray(this.observers, callback);
    };
  }

  private notifyObservers() {
    for (const observer of this.observers) {
      observer(this._message);
    }
  }
}

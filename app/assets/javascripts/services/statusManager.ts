import { removeFromArray } from 'snjs';
import { FooterStatus } from '@/types';

type StatusCallback = (string: string) => void

export class StatusManager {

  private statuses: FooterStatus[] = []
  private observers: StatusCallback[] = []

  replaceStatusWithString(status: FooterStatus, string: string) {
    this.removeStatus(status);
    return this.addStatusFromString(string);
  }

  addStatusFromString(string: string) {
    const status = { string };
    this.statuses.push(status);
    this.notifyObservers();
    return status;
  }

  removeStatus(status: FooterStatus) {
    removeFromArray(this.statuses, status);
    this.notifyObservers();
    return undefined;
  }

  addStatusObserver(callback: StatusCallback) {
    this.observers.push(callback);
    return () => {
      removeFromArray(this.observers, callback);
    }
  }

  private notifyObservers() {
    for(const observer of this.observers) {
      observer(this.getStatusString());
    }
  }

  private getStatusString() {
    let result = '';
    this.statuses.forEach((status, index) => {
      if(index > 0) {
        result += '  ';
      }
      result += status.string;
    });

    return result;
  }

}

import { removeFromArray } from 'snjs';
import { FooterStatus } from './../types';

type StatusCallback = (string: string) => void

export class StatusManager {

  private statuses: FooterStatus[] = []
  private observers: StatusCallback[] = []

  statusFromString(string: string) {
    return {string: string};
  }

  replaceStatusWithString(status: FooterStatus, string: string) {
    this.removeStatus(status);
    return this.addStatusFromString(string);
  }

  addStatusFromString(string: string) {
    return this.addStatus(this.statusFromString(string));
  }

  addStatus(status: FooterStatus) {
    this.statuses.push(status);
    this.notifyObservers();
    return status;
  }

  removeStatus(status: FooterStatus) {
    removeFromArray(this.statuses, status);
    this.notifyObservers();
    return undefined;
  }

  getStatusString() {
    let result = '';
    this.statuses.forEach((status, index) => {
      if(index > 0) {
        result += '  ';
      }
      result += status.string;
    });

    return result;
  }

  notifyObservers() {
    for(const observer of this.observers) {
      observer(this.getStatusString());
    }
  }

  addStatusObserver(callback: StatusCallback) {
    this.observers.push(callback);
    return () => {
      removeFromArray(this.observers, callback);
    }
  }
}

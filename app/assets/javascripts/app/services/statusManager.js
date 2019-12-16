import _ from 'lodash';

export class StatusManager {
  constructor() {
    this.statuses = [];
    this.observers = [];
  }

  statusFromString(string) {
    return {string: string};
  }

  replaceStatusWithString(status, string) {
    this.removeStatus(status);
    return this.addStatusFromString(string);
  }

  addStatusFromString(string) {
    return this.addStatus(this.statusFromString(string));
  }

  addStatus(status) {
    if(typeof status !== "object") {
      console.error("Attempting to set non-object status", status);
      return;
    }

    this.statuses.push(status);
    this.notifyObservers();
    return status;
  }

  removeStatus(status) {
    _.pull(this.statuses, status);
    this.notifyObservers();
    return null;
  }

  getStatusString() {
    let result = "";
    this.statuses.forEach((status, index) => {
      if(index > 0) {
        result += "  ";
      }
      result += status.string;
    })

    return result;
  }

  notifyObservers() {
    for(let observer of this.observers) {
      observer(this.getStatusString());
    }
  }

  addStatusObserver(callback) {
    this.observers.push(callback);
  }

  removeStatusObserver(callback) {
    _.pull(this.statuses, callback);
  }
}

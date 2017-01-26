class SyncProvider {

  constructor(obj) {
    this.encrypted = true;
    this.syncStatus = new SyncStatus();
    _.merge(this, obj);
  }

  addPendingItems(items) {
    if(!this.pendingItems) {
      this.pendingItems = [];
    }

    this.pendingItems = this.pendingItems.concat(items);
  }

  removePendingItems(items) {
    this.pendingItems = _.difference(this.pendingItems, items);
  }

  get isStandardNotesAccount() {
    return this.keyName == SNKeyName;
  }

  get status() {
    if(!this.enabled) {
      return null;
    }

    if(this.primary) return "primary";
    else return "secondary";
  }

  asJSON() {
    return {
      enabled: this.enabled,
      url: this.url,
      primary: this.primary,
      keyName: this.keyName,
      syncToken: this.syncToken
    }
  }
}

class SyncStatus {
  constructor() {

  }

  get statusString() {
    return `${this.current}/${this.total}`
  }
}

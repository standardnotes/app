class SyncProvider {
  constructor(obj) {
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
      encrypted: this.encrypted,
      ek: this.ek
    }
  }

}

SN.SyncProviderType = {
  Account: 1,
  URL: 2
}

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

    this.pendingItems = _.uniqBy(this.pendingItems.concat(items), "uuid");
  }

  removePendingItems(items) {
    this.pendingItems = _.difference(this.pendingItems, items);
  }

  get isStandardNotesAccount() {
    return this.keyName == SNKeyName;
  }

  get secondary() {
    return this.status == "secondary";
  }

  get status() {
    if(!this.enabled) {
      return null;
    }

    if(this.primary) return "primary";
    else return "secondary";
  }

  get name() {
    if(this.type == SN.SyncProviderType.account) {
      return this.email + "@" + this.url;
    } else {
      return this.url;
    }
  }

  asJSON() {
    return {
      enabled: this.enabled,
      url: this.url,
      type: this.type,
      primary: this.primary,
      keyName: this.keyName,
      syncToken: this.syncToken,

      // account based
      email: this.email,
      uuid: this.uuid,
      jwt: this.jwt,
      auth_params: this.auth_params
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

class SyncManager {

  constructor(modelManager) {
    this.modelManager = modelManager;
    this.syncPerformer = new SyncPerformer()
    this.SNKeyName = "Standard Notes Key";
    this.loadSyncProviders();
  }

  get offline() {
    return this.syncProviders.length == 0;
  }

  sync(callback) {
    this.syncPerformer.sync(this.syncProviders, callback);
  }

  syncWithProvider(provider, callback) {
    this.syncPerformer.performSyncWithProvider(provider, callback);
  }

  loadLocalItems(callback) {
    this.syncPerformer.loadLocalItems(callback);
  }

  syncProviderForURL(url) {
    var provider = _.find(this.syncProviders, {url: url});
    return provider;
  }

  findOrCreateSyncProviderForUrl(url) {
    var provider = _.find(this.syncProviders, {url: url});
    if(!provider) {
      provider = new SyncProvider({url: url})
    }
    return provider;
  }

  setEncryptionStatusForProviderURL(providerURL, encrypted) {
    this.providerForURL(providerURL).encrypted = encrypted;
    this.didMakeChangesToSyncProviders();
  }

  primarySyncProvider() {
    return _.find(this.syncProviders, {primary: true});
  }

  removeStandardFileSyncProvider() {
    var sfProvider = _.find(this.syncProviders, {url: this.defaultServerURL() + "/items/sync"})
    _.pull(this.syncProviders, sfProvider);
    this.didMakeChangesToSyncProviders();
  }

  addStandardFileSyncProvider(url) {
    var defaultProvider = new SyncProvider({url: url + "/items/sync", primary: this.syncProviders.length == 0});
    defaultProvider.keyName = this.SNKeyName;
    defaultProvider.enabled = this.syncProviders.length == 0;
    this.syncProviders.push(defaultProvider);
    return defaultProvider;
  }

  didMakeChangesToSyncProviders() {
    localStorage.setItem("syncProviders", JSON.stringify(_.map(this.syncProviders, function(provider) {
      return provider.asJSON()
    })));
  }

  loadSyncProviders() {
    this.syncProviders = [];
    var saved = localStorage.getItem("syncProviders");
    if(saved) {
      var parsed = JSON.parse(saved);
      for(var p of parsed) {
        this.syncProviders.push(new SyncProvider(p));
      }
    } else {
      // no providers saved, use default
      if(this.isUserSignedIn()) {
        var defaultProvider = this.addStandardFileSyncProvider(this.defaultServerURL());
        defaultProvider.syncToken = localStorage.getItem("syncToken");
        // migrate old key structure to new
        var mk = localStorage.getItem("mk");
        if(mk) {
          keyManager.addKey(this.SNKeyName, mk);
          localStorage.removeItem("mk");
        }
        this.didMakeChangesToSyncProviders();
      }
    }
  }

  addSyncProviderFromURL(url) {
    var provider = new SyncProvider({url: url});
    this.syncProviders.push(provider);
    this.didMakeChangesToSyncProviders();
  }

  enableSyncProvider(syncProvider, primary) {
    if(primary) {
      for(var provider of this.syncProviders) {
        provider.primary = false;
      }
    }

    syncProvider.enabled = true;
    syncProvider.primary = primary;

    // since we're enabling a new provider, we need to send it EVERYTHING we have now.
    this.addAllDataAsNeedingSyncForProvider(syncProvider);
    this.didMakeChangesToSyncProviders();
    this.syncWithProvider(syncProvider);
  }

  addAllDataAsNeedingSyncForProvider(syncProvider) {
    syncProvider.addPendingItems(this.modelManager.allItems);
  }

  removeSyncProvider(provider) {
    _.pull(this.syncProviders, provider);
    this.didMakeChangesToSyncProviders();
  }

  clearSyncToken() {
    var primary = this.primarySyncProvider();
    if(primary) {
      primary.syncToken = null;
    }
  }
}

angular.module('app.frontend').service('syncManager', SyncManager);

class SyncProvider {

  constructor(obj) {
    this.encrypted = true;
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
      primary: this.primary,
      keyName: this.keyName,
      syncToken: this.syncToken
    }
  }

}

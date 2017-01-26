export const SNKeyName = "Standard Notes Key";

class SyncManager {

  constructor(modelManager, syncRunner) {
    this.modelManager = modelManager;
    this.syncRunner = syncRunner;
    this.syncRunner.setOnChangeProviderCallback(function(){
      this.didMakeChangesToSyncProviders();
    }.bind(this))
    this.loadSyncProviders();
  }

  get offline() {
    return this.enabledProviders.length == 0;
  }

  serverURL() {
    return localStorage.getItem("server") || "https://n3.standardnotes.org";
  }

  get enabledProviders() {
    return this.syncProviders.filter(function(provider){return provider.enabled == true});
  }

  sync(callback) {
    this.syncRunner.sync(this.enabledProviders, callback);
  }

  syncWithProvider(provider, callback) {
    this.syncRunner.performSyncWithProvider(provider, callback);
  }

  loadLocalItems(callback) {
    this.syncRunner.loadLocalItems(callback);
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
    var sfProvider = _.find(this.syncProviders, {url: this.serverURL() + "/items/sync"})
    _.pull(this.syncProviders, sfProvider);
    this.didMakeChangesToSyncProviders();
  }

  addStandardFileSyncProvider(url) {
    var defaultProvider = new SyncProvider({url: url + "/items/sync", primary: !this.primarySyncProvider()});
    defaultProvider.keyName = SNKeyName;
    defaultProvider.enabled = this.syncProviders.length == 0;
    this.syncProviders.push(defaultProvider);
    this.didMakeChangesToSyncProviders();
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
      // no providers saved, this means migrating from old system to new
      // check if user is signed in
      if(this.offline && localStorage.getItem("user")) {
        var defaultProvider = this.addStandardFileSyncProvider(this.serverURL());
        defaultProvider.syncToken = localStorage.getItem("syncToken");
        // migrate old key structure to new
        var mk = localStorage.getItem("mk");
        if(mk) {
          keyManager.addKey(SNKeyName, mk);
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
    this.syncWithProvider(syncProvider);
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

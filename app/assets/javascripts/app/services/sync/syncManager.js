export const SNKeyName = "Standard Notes Key";

class SyncManager {

  constructor(modelManager, syncRunner, keyManager) {
    this.modelManager = modelManager;
    this.keyManager = keyManager;
    this.syncRunner = syncRunner;
    this.syncRunner.setOnChangeProviderCallback(function(){
      this.didMakeChangesToSyncProviders();
    }.bind(this))
    this.loadSyncProviders();
  }

  get offline() {
    return this.enabledProviders.length == 0;
  }

  defaultServerURL() {
    return "https://n3.standardnotes.org";
  }

  get enabledProviders() {
    return this.syncProviders.filter(function(provider){return provider.enabled == true});
  }

  /* Used when adding a new account with  */
  markAllOfflineItemsDirtyAndSave() {

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
      var userJSON = localStorage.getItem("user");
      if(this.offline && userJSON) {
        var user = JSON.parse(userJSON);
        var params = {
          url: localStorage.getItem("server"),
          email: user.email,
          uuid: user.uuid,
          ek: localStorage.getItem("mk"),
          jwt: response.token,
          auth_params: JSON.parse(localStorage.getItem("auth_params")),
        }
        var defaultProvider = this.addAccountBasedSyncProvider(params);
        defaultProvider.syncToken = localStorage.getItem("syncToken");
        localStorage.removeItem("mk");
        localStorage.removeItem("syncToken");
        localStorage.removeItem("auth_params");
        localStorage.removeItem("user");
        localStorage.removeItem("server");
        this.didMakeChangesToSyncProviders();
      }
    }
  }

  addAccountBasedSyncProvider({url, email, uuid, ek, jwt, auth_params} = {}) {
    var provider = new SyncProvider({
      url: url + "/items/sync",
      primary: !this.primarySyncProvider(),
      email: email,
      uuid: uuid,
      jwt: jwt,
      auth_params: auth_params,
      type: SN.SyncProviderType.account
    });

    provider.keyName = provider.name;

    this.syncProviders.push(provider);

    this.didMakeChangesToSyncProviders();

    this.keyManager.addKey(provider.keyName, ek);

    if(this.syncProviders.length == 0) {
      this.enableSyncProvider(provider, true);
    }

    return provider;
  }

  addSyncProviderFromURL(url) {
    var provider = new SyncProvider({url: url});
    provider.type = SN.SyncProviderType.URL;
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

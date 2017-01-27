class SyncRunner {

  constructor($rootScope, modelManager, dbManager, encryptionHelper, keyManager, Restangular) {
    this.rootScope = $rootScope;
    this.modelManager = modelManager;
    this.dbManager = dbManager;
    this.encryptionHelper = encryptionHelper;
    this.keyManager = keyManager;
    this.Restangular = Restangular;
  }

  setOnChangeProviderCallback(callback) {
    this.onChangeProviderCallback = callback;
  }

  didMakeChangesToSyncProvider(provider) {
    this.onChangeProviderCallback(provider);
  }

  writeItemsToLocalStorage(items, offlineOnly, callback) {
    var params = items.map(function(item) {
      var itemParams = new ItemParams(item, null);
      itemParams = itemParams.paramsForLocalStorage();
      if(offlineOnly) {
        delete itemParams.dirty;
      }
      return itemParams;
    }.bind(this));

    this.dbManager.saveItems(params, callback);
  }

  loadLocalItems(callback) {
    var params = this.dbManager.getAllItems(function(items){
      var items = this.handleItemsResponse(items, null, null);
      Item.sortItemsByDate(items);
      callback(items);
    }.bind(this))
  }

  syncOffline(items, callback) {
    this.writeItemsToLocalStorage(items, true, function(responseItems){
      // delete anything needing to be deleted
      for(var item of items) {
        if(item.deleted) {
          this.modelManager.removeItemLocally(item);
        }
      }
    }.bind(this))

    if(callback) {
      callback();
    }
  }

  sync(providers, callback, options = {}) {

    var allDirtyItems = this.modelManager.getDirtyItems();

    // we want to write all dirty items to disk only if the user has no sync providers, or if the sync op fails
    // if the sync op succeeds, these items will be written to disk by handling the "saved_items" response from the server
    if(providers.length == 0) {
      this.syncOffline(allDirtyItems, callback);
    }

    for(let provider of providers) {
      provider.addPendingItems(allDirtyItems);
      this.didMakeChangesToSyncProvider(provider);

      this.__performSyncWithProvider(provider, options, function(response){
        if(provider.primary) {
          if(callback) {
            callback(response)
          }
        }
      })
    }

    this.modelManager.clearDirtyItems(allDirtyItems);
  }

  performSyncWithProvider(provider, callback) {
    this.__performSyncWithProvider(provider, {}, callback);
  }

  __performSyncWithProvider(provider, options, callback) {
    if(provider.syncOpInProgress) {
      provider.repeatOnCompletion = true;
      console.log("Sync op in progress for provider; returning.", provider);
      return;
    }

    // whether this is a repeat sync (a continuation from another sync; we use this to update status accurately)
    var isRepeatRun = provider.repeatOnCompletion;

    provider.syncOpInProgress = true;

    let submitLimit = 100;
    var allItems = provider.pendingItems;
    var subItems = allItems.slice(0, submitLimit);
    if(subItems.length < allItems.length) {
      // more items left to be synced, repeat
      provider.repeatOnCompletion = true;
    } else {
      provider.repeatOnCompletion = false;
    }

    if(!isRepeatRun) {
      provider.syncStatus.total = allItems.length;
      provider.syncStatus.current = 0;
    }


    // Remove dirty items now. If this operation fails, we'll re-add them.
    // This allows us to queue changes on the same item
    provider.removePendingItems(subItems);

    var request = this.Restangular.oneUrl(provider.url, provider.url);
    request.limit = 150;
    request.items = _.map(subItems, function(item){
      var itemParams = new ItemParams(item, provider.ek);
      itemParams.additionalFields = options.additionalFields;
      return itemParams.paramsForSync();
    }.bind(this));

    // request.sync_token = provider.syncToken;
    request.cursor_token = provider.cursorToken;
    console.log("Syncing with provider:", provider, "items:", subItems.length, "token", request.sync_token);

    var headers = provider.jwt ? {Authorization: "Bearer " + provider.jwt} : {};
    request.post("", undefined, undefined, headers).then(function(response) {
      provider.error = null;

      console.log("Completed sync for provider:", provider.url, "Response:", response.plain());

      provider.syncToken = response.sync_token;

      if(provider.primary) {
        this.rootScope.$broadcast("sync:updated_token", provider.syncToken);

        // handle cursor token (more results waiting, perform another sync)
        provider.cursorToken = response.cursor_token;

        var retrieved = this.handleItemsResponse(response.retrieved_items, null, provider);
        // merge only metadata for saved items
        var omitFields = ["content", "auth_hash"];
        var saved = this.handleItemsResponse(response.saved_items, omitFields, provider);

        this.handleUnsavedItemsResponse(response.unsaved, provider)

        this.writeItemsToLocalStorage(saved, false, null);
        this.writeItemsToLocalStorage(retrieved, false, null);
      }

      provider.syncOpInProgress = false;
      provider.syncStatus.current += subItems.length;

      if(provider.cursorToken || provider.repeatOnCompletion == true) {
        this.__performSyncWithProvider(provider, options, callback);
      } else {
        if(callback) {
          callback(response);
        }
      }

    }.bind(this))
    .catch(function(response){
      console.log("Sync error: ", response);
      var error = response.data ? response.data.error : {message: "Could not connect to server."};

      // Re-add subItems since this operation failed. We'll have to try again.
      provider.addPendingItems(subItems);
      provider.syncOpInProgress = false;
      provider.error = error;

      if(provider.primary) {
        this.writeItemsToLocalStorage(allItems, false, null);
      }

      this.rootScope.$broadcast("sync:error", error);

      if(callback) {
        callback({error: "Sync error"});
      }
    }.bind(this))
  }

  handleUnsavedItemsResponse(unsaved, provider) {
    if(unsaved.length == 0) {
      return;
    }

    console.log("Handle unsaved", unsaved);
    for(var mapping of unsaved) {
      var itemResponse = mapping.item;
      var item = this.modelManager.findItem(itemResponse.uuid);
      var error = mapping.error;
      if(error.tag == "uuid_conflict") {
          item.alternateUUID();
          item.setDirty(true);
          item.markAllReferencesDirty();
      }
    }

    this.__performSyncWithProvider(provider, {additionalFields: ["created_at", "updated_at"]}, null);
  }

  handleItemsResponse(responseItems, omitFields, syncProvider) {
    var ek = syncProvider ? this.keyManager.keyForName(syncProvider.keyName).key : null;
    this.encryptionHelper.decryptMultipleItems(responseItems, ek);
    return this.modelManager.mapResponseItemsToLocalModelsOmittingFields(responseItems, omitFields);
  }
}

angular.module('app.frontend').service('syncRunner', SyncRunner);

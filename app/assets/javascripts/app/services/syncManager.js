class SyncManager {

  constructor($rootScope, modelManager, authManager, dbManager, Restangular) {
    this.$rootScope = $rootScope;
    this.modelManager = modelManager;
    this.authManager = authManager;
    this.Restangular = Restangular;
    this.dbManager = dbManager;
    this.syncStatus = {};
  }

  get serverURL() {
    return localStorage.getItem("server") || "https://n3.standardnotes.org";
  }

  get masterKey() {
    return localStorage.getItem("mk");
  }

  get serverPassword() {
    return localStorage.getItem("pw");
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

      if(callback) {
        callback({success: true});
      }
    }.bind(this))

  }

  markAllItemsDirtyAndSaveOffline(callback) {
    var items = this.modelManager.allItems;
    for(var item of items) {
      item.setDirty(true);
    }
    this.writeItemsToLocalStorage(items, false, callback);
  }

  get syncURL() {
    return this.serverURL + "/items/sync";
  }

  set syncToken(token) {
    this._syncToken = token;
    localStorage.setItem("syncToken", token);
  }

  get syncToken() {
    if(!this._syncToken) {
      this._syncToken = localStorage.getItem("syncToken");
    }
    return this._syncToken;
  }

  set cursorToken(token) {
    this._cursorToken = token;
    if(token) {
      localStorage.setItem("cursorToken", token);
    } else {
      localStorage.removeItem("cursorToken");
    }
  }

  get cursorToken() {
    if(!this._cursorToken) {
      this._cursorToken = localStorage.getItem("cursorToken");
    }
    return this._cursorToken;
  }

  get queuedCallbacks() {
    if(!this._queuedCallbacks) {
      this._queuedCallbacks = [];
    }
    return this._queuedCallbacks;
  }

  clearQueuedCallbacks() {
    this._queuedCallbacks = [];
  }

  callQueuedCallbacksAndCurrent(currentCallback, response) {
    var allCallbacks = this.queuedCallbacks;
    if(currentCallback) {
      allCallbacks.push(currentCallback);
    }
    if(allCallbacks.length) {
      for(var eachCallback of allCallbacks) {
        eachCallback(response);
      }
      this.clearQueuedCallbacks();
    }
  }

  sync(callback, options = {}) {

    if(this.syncStatus.syncOpInProgress) {
      this.repeatOnCompletion = true;
      if(callback) {
        this.queuedCallbacks.push(callback);
      }
      console.log("Sync op in progress; returning.");
      return;
    }

    var allDirtyItems = this.modelManager.getDirtyItems();

    // we want to write all dirty items to disk only if the user is offline, or if the sync op fails
    // if the sync op succeeds, these items will be written to disk by handling the "saved_items" response from the server
    if(this.authManager.offline()) {
      this.syncOffline(allDirtyItems, callback);
      this.modelManager.clearDirtyItems(allDirtyItems);
      return;
    }

    var isContinuationSync = this.syncStatus.needsMoreSync;

    this.syncStatus.syncOpInProgress = true;

    let submitLimit = 100;
    var subItems = allDirtyItems.slice(0, submitLimit);
    if(subItems.length < allDirtyItems.length) {
      // more items left to be synced, repeat
      this.syncStatus.needsMoreSync = true;
    } else {
      this.syncStatus.needsMoreSync = false;
    }

    if(!isContinuationSync) {
      this.syncStatus.total = allDirtyItems.length;
      this.syncStatus.current = 0;
    }

    var request = this.Restangular.oneUrl(this.syncURL, this.syncURL);
    request.limit = 150;
    request.items = _.map(subItems, function(item){
      var itemParams = new ItemParams(item, localStorage.getItem("mk"));
      itemParams.additionalFields = options.additionalFields;
      return itemParams.paramsForSync();
    }.bind(this));

    request.sync_token = this.syncToken;
    request.cursor_token = this.cursorToken;

    request.post().then(function(response) {
      this.modelManager.clearDirtyItems(subItems);
      this.syncStatus.error = null;

      this.$rootScope.$broadcast("sync:updated_token", this.syncToken);

      var retrieved = this.handleItemsResponse(response.retrieved_items, null);

      // merge only metadata for saved items
      // we write saved items to disk now because it clears their dirty status then saves
      // if we saved items before completion, we had have to save them as dirty and save them again on success as clean
      var omitFields = ["content", "auth_hash"];
      var saved = this.handleItemsResponse(response.saved_items, omitFields);

      this.handleUnsavedItemsResponse(response.unsaved)

      this.writeItemsToLocalStorage(saved, false, null);
      this.writeItemsToLocalStorage(retrieved, false, null);

      this.syncStatus.syncOpInProgress = false;
      this.syncStatus.current += subItems.length;

      // set the sync token at the end, so that if any errors happen above, you can resync
      this.syncToken = response.sync_token;
      this.cursorToken = response.cursor_token;

      if(this.cursorToken || this.syncStatus.needsMoreSync) {
        setTimeout(function () {
          this.sync(callback, options);
        }.bind(this), 10); // wait 10ms to allow UI to update
      } else if(this.repeatOnCompletion) {
        this.repeatOnCompletion = false;
        setTimeout(function () {
          this.sync(callback, options);
        }.bind(this), 10); // wait 10ms to allow UI to update
      } else {
        this.callQueuedCallbacksAndCurrent(callback, response);
      }

    }.bind(this))
    .catch(function(response){
      console.log("Sync error: ", response);
      var error = response.data ? response.data.error : {message: "Could not connect to server."};

      this.syncStatus.syncOpInProgress = false;
      this.syncStatus.error = error;
      this.writeItemsToLocalStorage(allDirtyItems, false, null);

      this.$rootScope.$broadcast("sync:error", error);

      this.callQueuedCallbacksAndCurrent(callback, {error: "Sync error"});
    }.bind(this))
  }

  handleUnsavedItemsResponse(unsaved) {
    if(unsaved.length == 0) {
      return;
    }

    console.log("Handle unsaved", unsaved);

    var i = 0;
    var handleNext = function() {
      if (i < unsaved.length) {
        var mapping = unsaved[i];
        var itemResponse = mapping.item;
        var item = this.modelManager.findItem(itemResponse.uuid);
        var error = mapping.error;
        if(error.tag == "uuid_conflict") {
          // uuid conflicts can occur if a user attempts to import an old data archive with uuids from the old account into a new account
          this.modelManager.alternateUUIDForItem(item, handleNext);
        }
        ++i;
      } else {
        this.sync(null, {additionalFields: ["created_at", "updated_at"]});
      }
    }.bind(this);

    handleNext();
  }

  handleItemsResponse(responseItems, omitFields) {
    EncryptionHelper.decryptMultipleItems(responseItems, localStorage.getItem("mk"));
    return this.modelManager.mapResponseItemsToLocalModelsOmittingFields(responseItems, omitFields);
  }

  clearSyncToken() {
    localStorage.removeItem("syncToken");
  }

  destroyLocalData(callback) {
    this.dbManager.clearAllItems(function(){
      localStorage.clear();
      if(callback) {
        callback();
      }
    });
  }
}

angular.module('app.frontend').service('syncManager', SyncManager);

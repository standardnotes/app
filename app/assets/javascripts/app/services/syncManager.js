class SyncManager {

  constructor($rootScope, modelManager, authManager, dbManager, httpManager, $interval, $timeout) {
    this.$rootScope = $rootScope;
    this.httpManager = httpManager;
    this.modelManager = modelManager;
    this.authManager = authManager;
    this.dbManager = dbManager;
    this.$interval = $interval;
    this.$timeout = $timeout;
    this.syncStatus = {};
  }

  get serverURL() {
    return localStorage.getItem("server") || window._default_sf_server;
  }

  get masterKey() {
    return localStorage.getItem("mk");
  }

  get serverPassword() {
    return localStorage.getItem("pw");
  }

  writeItemsToLocalStorage(items, offlineOnly, callback) {
    var version = this.authManager.protocolVersion();
    var params = items.map(function(item) {
      var itemParams = new ItemParams(item, null, version);
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

  beginCheckingIfSyncIsTakingTooLong() {
    this.syncStatus.checker = this.$interval(function(){
      // check to see if the ongoing sync is taking too long, alert the user
      var secondsPassed = (new Date() - this.syncStatus.syncStart) / 1000;
      var warningThreshold = 5; // seconds
      if(secondsPassed > warningThreshold) {
        this.$rootScope.$broadcast("sync:taking-too-long");
        this.stopCheckingIfSyncIsTakingTooLong();
      }
    }.bind(this), 500)
  }

  stopCheckingIfSyncIsTakingTooLong() {
    this.$interval.cancel(this.syncStatus.checker);
  }

  sync(callback, options = {}) {

    var allDirtyItems = this.modelManager.getDirtyItems();

    if(this.syncStatus.syncOpInProgress) {
      this.repeatOnCompletion = true;
      if(callback) {
        this.queuedCallbacks.push(callback);
      }

      // write to local storage nonetheless, since some users may see several second delay in server response.
      // if they close the browser before the ongoing sync request completes, local changes will be lost if we dont save here
      this.writeItemsToLocalStorage(allDirtyItems, false, null);

      console.log("Sync op in progress; returning.");
      return;
    }


    // we want to write all dirty items to disk only if the user is offline, or if the sync op fails
    // if the sync op succeeds, these items will be written to disk by handling the "saved_items" response from the server
    if(this.authManager.offline()) {
      this.syncOffline(allDirtyItems, callback);
      this.modelManager.clearDirtyItems(allDirtyItems);
      return;
    }

    var isContinuationSync = this.syncStatus.needsMoreSync;

    this.syncStatus.syncOpInProgress = true;
    this.syncStatus.syncStart = new Date();
    this.beginCheckingIfSyncIsTakingTooLong();

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

    // when doing a sync request that returns items greater than the limit, and thus subsequent syncs are required,
    // we want to keep track of all retreived items, then save to local storage only once all items have been retrieved,
    // so that relationships remain intact
    if(!this.allRetreivedItems) {
      this.allRetreivedItems = [];
    }

    var version = this.authManager.protocolVersion();
    var keys = this.authManager.keys();

    var params = {};
    params.limit = 150;
    params.items = _.map(subItems, function(item){
      var itemParams = new ItemParams(item, keys, version);
      itemParams.additionalFields = options.additionalFields;
      return itemParams.paramsForSync();
    }.bind(this));

    params.sync_token = this.syncToken;
    params.cursor_token = this.cursorToken;

    var onSyncCompletion = function(response) {
      this.stopCheckingIfSyncIsTakingTooLong();
    }.bind(this);

    var onSyncSuccess = function(response) {
      this.modelManager.clearDirtyItems(subItems);
      this.syncStatus.error = null;

      this.$rootScope.$broadcast("sync:updated_token", this.syncToken);

      var retrieved = this.handleItemsResponse(response.retrieved_items, null);
      this.allRetreivedItems = this.allRetreivedItems.concat(retrieved);

      // merge only metadata for saved items
      // we write saved items to disk now because it clears their dirty status then saves
      // if we saved items before completion, we had have to save them as dirty and save them again on success as clean
      var omitFields = ["content", "auth_hash"];
      var saved = this.handleItemsResponse(response.saved_items, omitFields);

      this.handleUnsavedItemsResponse(response.unsaved)
      this.writeItemsToLocalStorage(saved, false, null);

      this.syncStatus.syncOpInProgress = false;
      this.syncStatus.current += subItems.length;

      // set the sync token at the end, so that if any errors happen above, you can resync
      this.syncToken = response.sync_token;
      this.cursorToken = response.cursor_token;

      onSyncCompletion(response);

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
        this.writeItemsToLocalStorage(this.allRetreivedItems, false, null);
        this.allRetreivedItems = [];

        this.callQueuedCallbacksAndCurrent(callback, response);
        this.$rootScope.$broadcast("sync:completed");
      }
    }.bind(this);

    try {
      this.httpManager.postAbsolute(this.syncURL, params, function(response){

        try {
          onSyncSuccess(response);
        } catch(e) {
          console.log("Caught sync success exception:", e);
        }

      }.bind(this), function(response){
        console.log("Sync error: ", response);
        var error = response ? response.error : {message: "Could not connect to server."};

        this.syncStatus.syncOpInProgress = false;
        this.syncStatus.error = error;
        this.writeItemsToLocalStorage(allDirtyItems, false, null);

        onSyncCompletion(response);

        this.$rootScope.$broadcast("sync:error", error);

        this.callQueuedCallbacksAndCurrent(callback, {error: "Sync error"});
      }.bind(this));
    }
    catch(e) {
      console.log("Sync exception caught:", e);
    }
  }

  handleItemsResponse(responseItems, omitFields) {
    EncryptionHelper.decryptMultipleItems(responseItems, this.authManager.keys());
    var items = this.modelManager.mapResponseItemsToLocalModelsOmittingFields(responseItems, omitFields);
    return items;
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
        EncryptionHelper.decryptMultipleItems([itemResponse], this.authManager.keys());
        var item = this.modelManager.findItem(itemResponse.uuid);
        if(!item) {
          // could be deleted
          return;
        }
        var error = mapping.error;
        if(error.tag == "uuid_conflict") {
          // uuid conflicts can occur if a user attempts to import an old data archive with uuids from the old account into a new account
          this.modelManager.alternateUUIDForItem(item, handleNext);
        } else if(error.tag === "sync_conflict") {
          // create a new item with the same contents of this item if the contents differ
          itemResponse.uuid = null; // we want a new uuid for the new item
          var dup = this.modelManager.createItem(itemResponse);
          if(!itemResponse.deleted && JSON.stringify(item.structureParams()) !== JSON.stringify(dup.structureParams())) {
            this.modelManager.addItem(dup);
            dup.conflict_of = item.uuid;
            dup.setDirty(true);
          }
        }
        ++i;
      } else {
        this.sync(null, {additionalFields: ["created_at", "updated_at"]});
      }
    }.bind(this);

    handleNext();
  }

  clearSyncToken() {
    localStorage.removeItem("syncToken");
  }

  destroyLocalData(callback) {
    localStorage.clear();
    this.dbManager.clearAllItems(function(){
      if(callback) {
        this.$timeout(function(){
          callback();
        })
      }
    }.bind(this));
  }
}

angular.module('app.frontend').service('syncManager', SyncManager);

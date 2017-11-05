class ExtensionManager {

  constructor(httpManager, modelManager, authManager, syncManager, storageManager) {
      this.httpManager = httpManager;
      this.modelManager = modelManager;
      this.authManager = authManager;
      this.enabledRepeatActionUrls = JSON.parse(storageManager.getItem("enabledRepeatActionUrls")) || [];
      this.syncManager = syncManager;
      this.storageManager = storageManager;

      modelManager.addItemSyncObserver("extensionManager", "Extension", function(allItems, validItems, deletedItems){
        for (var ext of validItems) {
          for (var action of ext.actions) {
            if(_.includes(this.enabledRepeatActionUrls, action.url)) {
              this.enableRepeatAction(action, ext);
            }
          }
        }
      }.bind(this))
  }

  get extensions() {
    return this.modelManager.extensions;
  }

  extensionsInContextOfItem(item) {
    return this.extensions.filter(function(ext){
      return _.includes(ext.supported_types, item.content_type) || ext.actionsWithContextForItem(item).length > 0;
    })
  }

  actionWithURL(url) {
    for (var extension of this.extensions) {
      return _.find(extension.actions, {url: url})
    }
  }

  addExtension(url, callback) {
    this.retrieveExtensionFromServer(url, callback);
  }

  deleteExtension(extension) {
    for(var action of extension.actions) {
      if(action.repeat_mode) {
        if(this.isRepeatActionEnabled(action)) {
          this.disableRepeatAction(action);
        }
      }
    }

    this.modelManager.setItemToBeDeleted(extension);
    this.syncManager.sync(null);
  }

  /*
  Loads an extension in the context of a certain item. The server then has the chance to respond with actions that are
  relevant just to this item. The response extension is not saved, just displayed as a one-time thing.
  */
  loadExtensionInContextOfItem(extension, item, callback) {

    this.httpManager.getAbsolute(extension.url, {content_type: item.content_type, item_uuid: item.uuid}, function(response){
      this.updateExtensionFromRemoteResponse(extension, response);
      callback && callback(extension);
    }.bind(this), function(response){
      console.log("Error loading extension", response);
      if(callback) {
        callback(null);
      }
    }.bind(this))
  }

  /*
  Registers new extension and saves it to user's account
  */
  retrieveExtensionFromServer(url, callback) {
    this.httpManager.getAbsolute(url, {}, function(response){
      if(typeof response !== 'object') {
        callback(null);
        return;
      }
      var ext = this.handleExtensionLoadExternalResponseItem(url, response);
      if(callback) {
        callback(ext);
      }
    }.bind(this), function(response){
      console.error("Error registering extension", response);
      callback(null);
    })
  }

  handleExtensionLoadExternalResponseItem(url, externalResponseItem) {
    // Don't allow remote response to set these flags
    delete externalResponseItem.encrypted;
    delete externalResponseItem.uuid;

    var extension = _.find(this.extensions, {url: url});
    if(extension) {
      this.updateExtensionFromRemoteResponse(extension, externalResponseItem);
    } else {
      extension = new Extension(externalResponseItem);
      extension.url = url;
      extension.setDirty(true);
      this.modelManager.addItem(extension);
      this.syncManager.sync(null);
    }

    return extension;
  }

  updateExtensionFromRemoteResponse(extension, response) {
    if(response.description) {
      extension.description = response.description;
    }
    if(response.supported_types) {
      extension.supported_types = response.supported_types;
    }

    if(response.actions) {
      extension.actions = response.actions.map(function(action){
        return new Action(action);
      })
    } else {
      extension.actions = [];
    }
  }

  refreshExtensionsFromServer() {
    for (var url of this.enabledRepeatActionUrls) {
      var action = this.actionWithURL(url);
      if(action) {
        this.disableRepeatAction(action);
      }
    }

    for(var ext of this.extensions) {
      this.retrieveExtensionFromServer(ext.url, function(extension){
        extension.setDirty(true);
      });
    }
  }

  executeAction(action, extension, item, callback) {

    if(extension.encrypted && this.authManager.offline()) {
      alert("To send data encrypted, you must have an encryption key, and must therefore be signed in.");
      callback(null);
      return;
    }

    var customCallback = function(response) {
      action.running = false;
      callback(response);
    }

    action.running = true;

    switch (action.verb) {
      case "get": {

        this.httpManager.getAbsolute(action.url, {}, function(response){
          action.error = false;
          var items = response.items || [response.item];
          EncryptionHelper.decryptMultipleItems(items, this.authManager.keys());
          items = this.modelManager.mapResponseItemsToLocalModels(items);
          for(var item of items) {
            item.setDirty(true);
          }
          this.syncManager.sync(null);
          customCallback({items: items});
        }.bind(this), function(response){
          action.error = true;
          customCallback(null);
        })

        break;
      }

      case "render": {

        this.httpManager.getAbsolute(action.url, {}, function(response){
          action.error = false;
          EncryptionHelper.decryptItem(response.item, this.authManager.keys());
          var item = this.modelManager.createItem(response.item);
          customCallback({item: item});

        }.bind(this), function(response){
          action.error = true;
          customCallback(null);
        })

        break;
      }

      case "show": {
        var win = window.open(action.url, '_blank');
        win.focus();
        customCallback();
        break;
      }

      case "post": {
        var params = {};

        if(action.all) {
          var items = this.modelManager.allItemsMatchingTypes(action.content_types);
          params.items = items.map(function(item){
            var params = this.outgoingParamsForItem(item, extension);
            return params;
          }.bind(this))

        } else {
          params.items = [this.outgoingParamsForItem(item, extension)];
        }

        this.performPost(action, extension, params, function(response){
          customCallback(response);
        });

        break;
      }

      default: {

      }
    }

    action.lastExecuted = new Date();
  }

  isRepeatActionEnabled(action) {
    return _.includes(this.enabledRepeatActionUrls, action.url);
  }

  disableRepeatAction(action, extension) {
    _.pull(this.enabledRepeatActionUrls, action.url);
    this.storageManager.setItem("enabledRepeatActionUrls", JSON.stringify(this.enabledRepeatActionUrls));
    this.modelManager.removeItemChangeObserver(action.url);

    console.assert(this.isRepeatActionEnabled(action) == false);
  }

  enableRepeatAction(action, extension) {
    if(!_.find(this.enabledRepeatActionUrls, action.url)) {
      this.enabledRepeatActionUrls.push(action.url);
      this.storageManager.setItem("enabledRepeatActionUrls", JSON.stringify(this.enabledRepeatActionUrls));
    }

    if(action.repeat_mode) {

      if(action.repeat_mode == "watch") {
        this.modelManager.addItemChangeObserver(action.url, action.content_types, function(changedItems){
          this.triggerWatchAction(action, extension, changedItems);
        }.bind(this))
      }

      if(action.repeat_mode == "loop") {
        // todo
      }

    }
  }

  queueAction(action, extension, delay, changedItems) {
    this.actionQueue = this.actionQueue || [];
    if(_.find(this.actionQueue, {url: action.url})) {
      return;
    }

    this.actionQueue.push(action);

    setTimeout(function () {
      this.triggerWatchAction(action, extension, changedItems);
      _.pull(this.actionQueue, action);
    }.bind(this), delay * 1000);
  }

  triggerWatchAction(action, extension, changedItems) {
    if(action.repeat_timeout > 0) {
      var lastExecuted = action.lastExecuted;
      var diffInSeconds = (new Date() - lastExecuted)/1000;
      if(diffInSeconds < action.repeat_timeout) {
        var delay = action.repeat_timeout - diffInSeconds;
        this.queueAction(action, extension, delay, changedItems);
        return;
      }
    }

    action.lastExecuted = new Date();

    if(action.verb == "post") {
      var params = {};
      params.items = changedItems.map(function(item){
        var params = this.outgoingParamsForItem(item, extension);
        return params;
      }.bind(this))

      action.running = true;
      this.performPost(action, extension, params, function(){
        action.running = false;
      });
    } else {
      // todo
    }
  }

  outgoingParamsForItem(item, extension) {
    var keys = this.authManager.keys();
    if(!extension.encrypted) {
      keys = null;
    }
    var itemParams = new ItemParams(item, keys, this.authManager.protocolVersion());
    return itemParams.paramsForExtension();
  }

  performPost(action, extension, params, callback) {

    if(extension.encrypted) {
      params.auth_params = this.authManager.getAuthParams();
    }

    this.httpManager.postAbsolute(action.url, params, function(response){
      action.error = false;
      if(callback) {
        callback(response);
      }
    }.bind(this), function(response){
      action.error = true;
      console.log("Action error response:", response);
      if(callback) {
        callback({error: "Request error"});
      }
    })
  }

}

angular.module('app.frontend').service('extensionManager', ExtensionManager);

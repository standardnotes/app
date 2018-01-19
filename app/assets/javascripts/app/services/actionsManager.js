class ActionsManager {

  constructor(httpManager, modelManager, authManager, syncManager, storageManager) {
      this.httpManager = httpManager;
      this.modelManager = modelManager;
      this.authManager = authManager;
      this.enabledRepeatActionUrls = JSON.parse(storageManager.getItem("enabledRepeatActionUrls")) || [];
      this.syncManager = syncManager;
      this.storageManager = storageManager;
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
    for(var ext of this.extensions) {
      this.retrieveExtensionFromServer(ext.url, function(extension){
        extension.setDirty(true);
      });
    }
  }

  executeAction(action, extension, item, callback) {

    var customCallback = function(response) {
      action.running = false;
      callback(response);
    }

    action.running = true;

    let decrypted = action.access_type == "decrypted";

    switch (action.verb) {
      case "get": {

        this.httpManager.getAbsolute(action.url, {}, function(response){
          action.error = false;
          var items = response.items || [response.item];
          EncryptionHelper.decryptMultipleItems(items, this.authManager.keys());
          items = this.modelManager.mapResponseItemsToLocalModels(items, ModelManager.MappingSourceRemoteActionRetrieved);
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
            var params = this.outgoingParamsForItem(item, extension, decrypted);
            return params;
          }.bind(this))

        } else {
          params.items = [this.outgoingParamsForItem(item, extension, decrypted)];
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

  outgoingParamsForItem(item, extension, decrypted = false) {
    var keys = this.authManager.keys();
    if(decrypted) {
      keys = null;
    }
    var itemParams = new ItemParams(item, keys, this.authManager.protocolVersion());
    return itemParams.paramsForExtension();
  }

  performPost(action, extension, params, callback) {
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

angular.module('app.frontend').service('actionsManager', ActionsManager);

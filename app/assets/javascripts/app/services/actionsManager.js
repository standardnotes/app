class ActionsManager {

  constructor(httpManager, modelManager, authManager, syncManager) {
      this.httpManager = httpManager;
      this.modelManager = modelManager;
      this.authManager = authManager;
      this.syncManager = syncManager;
  }

  get extensions() {
    return this.modelManager.extensions;
  }

  extensionsInContextOfItem(item) {
    return this.extensions.filter(function(ext){
      return _.includes(ext.supported_types, item.content_type) || ext.actionsWithContextForItem(item).length > 0;
    })
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

  updateExtensionFromRemoteResponse(extension, response) {
    if(response.description) { extension.description = response.description; }
    if(response.supported_types) { extension.supported_types = response.supported_types; }

    if(response.actions) {
      extension.actions = response.actions.map(function(action){
        return new Action(action);
      })
    } else {
      extension.actions = [];
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

        this.httpManager.getAbsolute(action.url, {}, (response) => {
          action.error = false;
          var items = response.items || [response.item];
          SFJS.itemTransformer.decryptMultipleItems(items, this.authManager.keys()).then(() => {
            items = this.modelManager.mapResponseItemsToLocalModels(items, ModelManager.MappingSourceRemoteActionRetrieved);
            for(var item of items) {
              item.setDirty(true);
            }
            this.syncManager.sync(null);
            customCallback({items: items});
          })
        }, (response) => {
          action.error = true;
          customCallback(null);
        })

        break;
      }

      case "render": {

        this.httpManager.getAbsolute(action.url, {}, (response) => {
          action.error = false;
          SFJS.itemTransformer.decryptItem(response.item, this.authManager.keys()).then(() => {
            var item = this.modelManager.createItem(response.item, true /* Dont notify observers */);
            customCallback({item: item});
          })
        }, (response) => {
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
        this.outgoingParamsForItem(item, extension, decrypted).then((itemParams) => {
          var params = {
            items: [itemParams] // Wrap it in an array
          }

          this.performPost(action, extension, params, function(response){
            customCallback(response);
          });
        })

        break;
      }

      default: {

      }
    }

    action.lastExecuted = new Date();
  }

  async outgoingParamsForItem(item, extension, decrypted = false) {
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

angular.module('app').service('actionsManager', ActionsManager);

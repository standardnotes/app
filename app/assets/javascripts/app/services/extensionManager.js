class ExtensionManager {

  constructor(Restangular, modelManager) {
      this.Restangular = Restangular;
      this.modelManager = modelManager;
      this.extensions = [];
      this.enabledRepeatActions = [];
      this.enabledRepeatActionUrls = localStorage.getItem("enabled_ext_urls") || [];
  }

  addExtension(url) {
    console.log("Registering URL", url);
    this.Restangular.oneUrl(url, url).get().then(function(response){
      console.log("get response", response.plain());
      var extension = new Extension(response.plain());
      this.registerExtension(extension);
    }.bind(this))
    .catch(function(response){
      console.log("Error registering extension", response);
    })
  }

  registerExtension(extension) {
      this.extensions.push(extension);
      console.log("registered extensions", this.extensions);
  }

  executeAction(action, extension, callback) {
    if(action.type == "get") {
      this.Restangular.oneUrl(action.url, action.url).get().then(function(response){
        console.log("Execute action response", response);
        var items = response.items;
        this.modelManager.mapResponseItemsToLocalModels(items);
        callback(items);
      }.bind(this))
    }
  }

  isRepeatActionEnabled(action) {
    return this.enabledRepeatActionUrls.includes(action.url);
  }

  disableRepeatAction(action, extension) {
    console.log("Disabling action", action);
    _.pull(this.enabledRepeatActionUrls, action.url);
    _.pull(this.enabledRepeatActions, action);
    this.modelManager.removeItemObserver(action.url);
    console.assert(this.isRepeatActionEnabled(action) == false);
  }

  enableRepeatAction(action, extension) {
    console.log("Enabling repeat action", action);

    this.enabledRepeatActionUrls.push(action.url);
    this.enabledRepeatActions.push(action);

    if(action.repeatType == "watch") {
      for(var structure of action.structures) {
        this.modelManager.addItemObserver(action.url, structure.type, function(changedItems){
          this.triggerWatchAction(action, changedItems);
        }.bind(this))
      }
    }
  }

  triggerWatchAction(action, changedItems) {
    console.log("Watch action triggered", action, changedItems);
    if(action.repeatFrequency > 0) {
      var lastExecuted = action.lastExecuted;
      var diffInSeconds = (new Date() - lastExecuted)/1000;
      if(diffInSeconds < action.repeatFrequency) {
        console.log("too frequent, returning");
        return;
      }
    }

    if(action.repeatVerb == "post") {
      var request = this.Restangular.oneUrl(action.url, action.url);
      request.items = changedItems.map(function(item){
        var params = {uuid: item.uuid, content_type: item.content_type, content: item.content};
        return params;
      })
      request.post().then(function(response){
        console.log("watch action response", response);
        action.lastExecuted = new Date();
      })
    }
  }

}

angular.module('app.frontend').service('extensionManager', ExtensionManager);

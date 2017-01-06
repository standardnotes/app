class ExtensionManager {

  constructor(Restangular, modelManager, apiController) {
      this.Restangular = Restangular;
      this.modelManager = modelManager;
      this.apiController = apiController;
      this.enabledRepeatActionUrls = JSON.parse(localStorage.getItem("enabledRepeatActionUrls")) || [];

      modelManager.addItemSyncObserver("extensionManager", "Extension", function(items){
        for (var ext of items) {
          for (var action of ext.actions) {
            if(this.enabledRepeatActionUrls.includes(action.url)) {
              this.enableRepeatAction(action, ext);
            }
          }
        }
      }.bind(this))
  }

  get extensions() {
    return this.modelManager.extensions;
  }

  actionWithURL(url) {
    for (var extension of this.extensions) {
      return _.find(extension.actions, {url: url})
    }
  }

  addExtension(url) {
    this.retrieveExtensionFromServer(url, null);
  }

  retrieveExtensionFromServer(url, callback) {
    console.log("Registering URL", url);
    this.Restangular.oneUrl(url, url).get().then(function(response){
      var ext = this.handleExtensionLoadExternalResponseItem(url, response.plain());
      if(callback) {
        callback(ext);
      }
    }.bind(this))
    .catch(function(response){
      console.log("Error registering extension", response);
    })
  }

  handleExtensionLoadExternalResponseItem(url, externalResponseItem) {
    var extension = _.find(this.extensions, {url: url});
    if(extension) {
      extension.updateFromExternalResponseItem(externalResponseItem);
    } else {
      extension = new Extension(externalResponseItem);
      extension.url = url;
      extension.setDirty(true);
      this.modelManager.addItem(extension);
      this.apiController.sync(null);
    }

    return extension;
  }

  refreshExtensionsFromServer() {
    for (var url of this.enabledRepeatActionUrls) {
      var action = this.actionWithURL(url);
      this.disableRepeatAction(action);
    }

    for(var ext of this.extensions) {
      this.retrieveExtensionFromServer(ext.url, function(extension){
        extension.setDirty(true);
      });
    }
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

     else if(action.type == "show") {
      var win = window.open(action.url, '_blank');
      win.focus();
      callback();
    }

     else if(action.actionType == "all") {
      var allItems = this.modelManager.allItemsMatchingTypes(action.structureContentTypes());
      this.performPost(action, allItems, function(items){
        callback(items);
      });
    }

    action.lastExecuted = new Date();
  }

  isRepeatActionEnabled(action) {
    return this.enabledRepeatActionUrls.includes(action.url);
  }

  disableRepeatAction(action, extension) {
    console.log("Disabling action", action);
    _.pull(this.enabledRepeatActionUrls, action.url);
    this.modelManager.removeItemChangeObserver(action.url);
    console.assert(this.isRepeatActionEnabled(action) == false);
  }

  enableRepeatAction(action, extension) {
    console.log("Enabling repeat action", action);

    if(!_.find(this.enabledRepeatActionUrls, action.url)) {
      this.enabledRepeatActionUrls.push(action.url);
      localStorage.setItem("enabledRepeatActionUrls", JSON.stringify(this.enabledRepeatActionUrls));
    }

    if(action.repeatType == "watch") {
      for(var structure of action.structures) {
        this.modelManager.addItemChangeObserver(action.url, structure.type, function(changedItems){
          this.triggerWatchAction(action, changedItems);
        }.bind(this))
      }
    }
  }

  queueAction(action, delay, changedItems) {
    this.actionQueue = this.actionQueue || [];
    if(_.find(this.actionQueue, action)) {
      return;
    }

    this.actionQueue.push(action);

    setTimeout(function () {
      console.log("Performing queued action", action);
      this.triggerWatchAction(action, changedItems);
      _.pull(this.actionQueue, action);
    }.bind(this), delay * 1000);
  }

  outgoingParamsForItem(item) {
    return this.apiController.paramsForExternalUse(item);
  }

  triggerWatchAction(action, changedItems) {
    // console.log("Watch action triggered", action, changedItems);
    if(action.repeatFrequency > 0) {
      var lastExecuted = action.lastExecuted;
      var diffInSeconds = (new Date() - lastExecuted)/1000;
      console.log("last executed", action.lastExecuted, "diff", diffInSeconds, "repeatFreq", action.repeatFrequency);
      if(diffInSeconds < action.repeatFrequency) {
        var delay = action.repeatFrequency - diffInSeconds;
        console.log("delaying action by", delay);
        this.queueAction(action, delay, changedItems);
        return;
      }
    }

    console.log("Performing action immediately", action);

    action.lastExecuted = new Date();

    if(action.repeatVerb == "post") {
      this.performPost(action, changedItems, null);
    }
  }

  performPost(action, items, callback) {
    var request = this.Restangular.oneUrl(action.url, action.url);
    request.items = items.map(function(item){
      var params = this.outgoingParamsForItem(item);
      return params;
    }.bind(this))

    request.post().then(function(response){
      // console.log("watch action response", response);
      if(callback) {
        callback(response.plain());
      }
    })
  }

}

angular.module('app.frontend').service('extensionManager', ExtensionManager);

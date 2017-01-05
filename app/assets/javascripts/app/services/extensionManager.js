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
      console.log("get response", response.plain());
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
      console.log("updated existing ext", extension);
    } else {
      console.log("creating new ext", externalResponseItem);
      extension = new Extension(externalResponseItem);
      extension.url = url;
      extension.dirty = true;
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
        extension.dirty = true;
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
  }

  isRepeatActionEnabled(action) {
    return this.enabledRepeatActionUrls.includes(action.url);
  }

  disableRepeatAction(action, extension) {
    console.log("Disabling action", action);
    _.pull(this.enabledRepeatActionUrls, action.url);
    this.modelManager.removeItemSyncObserver(action.url);
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
        this.modelManager.addItemSyncObserver(action.url, structure.type, function(changedItems){
          this.triggerWatchAction(action, changedItems);
        }.bind(this))
      }
    }
  }

  queueAction(action, delay, changedItems) {
    this.actionQueue = this.actionQueue || [];
    if(_.find(this.actionQueue, action)) {
      // console.log("Action already queued, skipping.")
      return;
    }

    // console.log("Adding action to queue", action);

    this.actionQueue.push(action);

    setTimeout(function () {
      console.log("Performing queued action", action);
      this.triggerWatchAction(action, changedItems);
      _.pull(this.actionQueue, action);
    }.bind(this), delay * 1000);
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
    // console.log("setting last exectured", action.lastExecuted)

    if(action.repeatVerb == "post") {
      var request = this.Restangular.oneUrl(action.url, action.url);
      request.items = changedItems.map(function(item){
        var params = {uuid: item.uuid, content_type: item.content_type, content: item.createContentJSONFromProperties()};
        return params;
      })
      request.post().then(function(response){
        // console.log("watch action response", response);
      })
    }
  }

}

angular.module('app.frontend').service('extensionManager', ExtensionManager);

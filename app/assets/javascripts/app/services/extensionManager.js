class ExtensionManager {

  constructor(Restangular, modelManager, apiController) {
      this.Restangular = Restangular;
      this.modelManager = modelManager;
      this.apiController = apiController;
      this.enabledRepeatActionUrls = JSON.parse(localStorage.getItem("enabledRepeatActionUrls")) || [];
      this.decryptedExtensions = JSON.parse(localStorage.getItem("decryptedExtensions")) || [];

      modelManager.addItemSyncObserver("extensionManager", "Extension", function(items){
        for (var ext of items) {

          ext.encrypted = this.extensionUsesEncryptedData(ext);

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

  extensionUsesEncryptedData(extension) {
    return !this.decryptedExtensions.includes(extension.url);
  }

  changeExtensionEncryptionFormat(encrypted, extension) {
    if(encrypted) {
      _.pull(this.decryptedExtensions, extension.url);
    } else {
      this.decryptedExtensions.push(extension.url);
    }

    localStorage.setItem("decryptedExtensions", JSON.stringify(this.decryptedExtensions))

    extension.encrypted = this.extensionUsesEncryptedData(extension);

    console.log("ext with dec", this.decryptedExtensions);
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

  executeAction(action, extension, item, callback) {

    switch (action.verb) {
      case "get": {
        this.Restangular.oneUrl(action.url, action.url).get().then(function(response){
          console.log("Execute action response", response);
          var items = response.items;
          this.modelManager.mapResponseItemsToLocalModels(items);
          callback(items);
        }.bind(this))

        break;
      }

      case "show": {
        var win = window.open(action.url, '_blank');
        win.focus();
        callback();
      }

      case "post": {
        var items;
        if(action.all) {
          items = this.modelManager.allItemsMatchingTypes(action.content_types);
        } else {
          items = [item];
        }

        this.performPost(action, extension, items, function(items){
          callback(items);
        });
      }

      default: {

      }
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
    if(_.find(this.actionQueue, action)) {
      return;
    }

    this.actionQueue.push(action);

    setTimeout(function () {
      console.log("Performing queued action", action);
      this.triggerWatchAction(action, extension, changedItems);
      _.pull(this.actionQueue, action);
    }.bind(this), delay * 1000);
  }

  triggerWatchAction(action, extension, changedItems) {
    // console.log("Watch action triggered", action, changedItems);
    if(action.repeat_timeout > 0) {
      var lastExecuted = action.lastExecuted;
      var diffInSeconds = (new Date() - lastExecuted)/1000;
      console.log("last executed", action.lastExecuted, "diff", diffInSeconds, "repeatFreq", action.repeatFrequency);
      if(diffInSeconds < action.repeat_timeout) {
        var delay = action.repeat_timeout - diffInSeconds;
        console.log("delaying action by", delay);
        this.queueAction(action, delay, changedItems);
        return;
      }
    }

    console.log("Performing action immediately", action);

    action.lastExecuted = new Date();

    if(action.verb == "post") {
      this.performPost(action, extension, changedItems, null);
    } else {
      // todo
    }
  }

  outgoingParamsForItem(item, extension) {
    return this.apiController.paramsForExtension(item, this.extensionUsesEncryptedData(extension));
  }

  performPost(action, extension, items, callback) {
    var request = this.Restangular.oneUrl(action.url, action.url);
    request.items = items.map(function(item){
      var params = this.outgoingParamsForItem(item, extension);
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

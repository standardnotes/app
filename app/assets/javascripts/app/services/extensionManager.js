class Extension {
  constructor(json) {
      _.merge(this, json);

      this.actions = this.actions.map(function(action){
        return new Action(action);
      })
  }
}

class Action {
  constructor(json) {
      _.merge(this, json);

      var comps = this.type.split(":");
      if(comps.length > 0) {
        this.repeatable = true;
        this.repeatType = comps[0]; // 'watch' or 'poll'
        this.repeatVerb = comps[1]; // http verb
        this.repeatFrequency = comps[2];
      }
  }
}

class ExtensionManager {

  constructor(Restangular, modelManager) {
      this.Restangular = Restangular;
      this.modelManager = modelManager;
      this.extensions = [];
      this.enabledRepeatActions = [];
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
      for(var action of extension.actions) {
        if(action.repeatable) {
          this.enableRepeatAction(action);
        }
      }
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

  enableRepeatAction(action, extension) {
    console.log("Enabling repeat action", action);
    this.enabledRepeatActions.push(action);
    if(action.repeatType == "watch") {
      for(var structure of action.structures) {
        this.modelManager.watchItemType(structure.type, function(changedItems){
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
        action.lastExecuted =  new Date();
      })
    }
  }

}

angular.module('app.frontend').service('extensionManager', ExtensionManager);

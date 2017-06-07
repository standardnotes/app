class ComponentManager {

  constructor(modelManager, syncManager, $timeout) {
    this.modelManager = modelManager;
    this.syncManager = syncManager;
    this.timeout = $timeout;
    this.selectionObservers = [];
    this.activationObservers = [];

    window.addEventListener("message", function(event){
      console.log("Web app: received message", event.data);
      this.handleMessage(this.componentForSessionKey(event.data.sessionKey), event.data);
    }.bind(this), false);
  }

  get components() {
    return this.modelManager.itemsForContentType("SN|Component");
  }

  componentForSessionKey(key) {
    return _.find(this.components, {sessionKey: key});
  }

  handleMessage(component, message) {

    if(message.action === "stream-items") {
      this.handleStreamItemsMessage(component, message);
    }

    else if(message.action === "save-items") {
      var responseItems = message.data.items;
      var localItems = this.modelManager.mapResponseItemsToLocalModels(responseItems);


      for(var item of localItems) {
        var responseItem = _.find(responseItems, {uuid: item.uuid});
        _.merge(item.content, responseItem.content);
        item.setDirty(true);
      }
      this.syncManager.sync();
    }

    else if(message.action === "select-item") {
      var item = this.modelManager.findItem(message.data.uuid);
      for(var observer of this.selectionObservers) {
        if(observer.contentType === item.content_type) {
          this.timeout(function(){
            observer.callback(item);
          })
        }
      }
    }

    else if(message.action === "clear-selection") {
      for(var observer of this.selectionObservers) {
        if(observer.contentType === message.data.content_type) {
          this.timeout(function(){
            observer.callback(null);
          })
        }
      }
    }
  }

  handleStreamItemsMessage(component, message) {
    var sendItems = function(items) {
      var response = {items: {}};
      var mapped = items.map(function(item) {
        var params = {uuid: item.uuid, content_type: item.content_type, created_at: item.created_at};
        params.content = item.createContentJSONFromProperties();
        return params;
      }.bind(this));

      response.items[contentType] = mapped;
      this.replyToMessage(component, message, response);
    }.bind(this);

    if(!this.verifyPermissions(component, message.data.content_types)) {
      var result = this.promptForPermissions(component, message.data.content_types);
      if(!result) {
        return;
      }
    }

    for(var contentType of message.data.content_types) {
      this.modelManager.addItemSyncObserver(component.url, contentType, function(items){
        sendItems(items);
      }.bind(this))

      var items = this.modelManager.itemsForContentType(contentType);
      sendItems(items);
    }
  }

  promptForPermissions(component, requestedPermissions) {
    var permissions = requestedPermissions.map(function(p){return p + "s"});
    var message = "The following component is requesting access to these items:\n\n";
    message += "Component: " + component.url + "\n\n";
    message += "Items: " + permissions.join(", ");
    if(confirm(message)) {
      component.permissions = requestedPermissions;
      return true;
    } else {
      return false;
    }
  }

  verifyPermissions(component, requestedPermissions) {
    if(!component.permissions) {
      return false;
    }
    return _.isEqual(component.permissions.sort(), requestedPermissions.sort());
  }

  replyToMessage(component, originalMessage, replyData) {
    var reply = {
      action: "reply",
      original: originalMessage,
      data: replyData
    }

    console.log("About to reply to message", component, reply);

    this.sendMessageToComponent(component, reply);
  }

  sendMessageToComponent(component, message) {
    console.log("Sending message to component: ", component, message);
    component.window.postMessage(message, component.url);
  }

  addSelectionObserver(identifier, contentType, callback) {
    this.selectionObservers.push({
      identifier: identifier,
      contentType: contentType,
      callback: callback
    })
  }

  addActivationObserver(identifier, area, callback) {
    this.activationObservers.push({
      identifier: identifier,
      area: area,
      callback: callback
    })
  }

  installComponent(url) {
    var name = getParameterByName("name", url);
    var area = getParameterByName("area", url);
    var component = this.modelManager.createItem({
      content_type: "SN|Component",
      url: url,
      name: name,
      area: area
    })

    this.modelManager.addItem(component);
    component.setDirty(true);
    this.syncManager.sync();
  }

  activateComponent(component) {
    component.active = true;
    this.activationObservers.forEach(function(observer){
      if(observer.area == component.area) {
        observer.callback(component);
      }
    })
  }

  // Called by other views when the iframe is ready
  registerComponentWindow(component, componentWindow) {
    console.log("Registering component window", componentWindow);
    component.window = componentWindow;
    component.sessionKey = Neeto.crypto.generateUUID();
    this.sendMessageToComponent(component, {action: "component-registered", sessionKey: component.sessionKey});
  }

  deactivateComponent(component) {
    component.active = false;
    component.sessionKey = null;
    this.activationObservers.forEach(function(observer){
      if(observer.area == component.area) {
        observer.callback(component);
      }
    })
  }

  deleteComponent(component) {
    this.modelManager.setItemToBeDeleted(component);
    this.syncManager.sync();
  }

  isComponentActive(component) {
    return component.active;
  }


}

angular.module('app.frontend').service('componentManager', ComponentManager);

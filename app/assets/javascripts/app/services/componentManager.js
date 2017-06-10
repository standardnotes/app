class ComponentManager {

  constructor($rootScope, modelManager, syncManager, $timeout) {
    this.modelManager = modelManager;
    this.syncManager = syncManager;
    this.timeout = $timeout;
    this.actionObservers = [];
    this.activationObservers = [];
    this.contextHandlers = [];
    this.streamObservers = [];
    this.streamReferencesObservers = [];

    window.addEventListener("message", function(event){
      console.log("Web app: received message", event);
      this.handleMessage(this.componentForSessionKey(event.data.sessionKey), event.data);
    }.bind(this), false);

    this.modelManager.addItemSyncObserver("component-manager", "*", function(items){

      for(var observer of this.streamObservers) {
        var relevantItems = items.filter(function(item){
          return observer.contentTypes.indexOf(item.content_type) !== -1;
        })

        this.sendItemsInReply(observer.component, relevantItems, observer.originalMessage);
      }

      for(var observer of this.streamReferencesObservers) {
        for(var contextHandler of this.contextHandlers) {
          if(contextHandler.component !== observer.component) {
            continue;
          }
          var itemInContext = contextHandler.handler();
          var matchingItem = _.find(items, {uuid: itemInContext.uuid});
          if(matchingItem) {
            this.sendReferencesInReply(observer.component, matchingItem.referenceParams(), observer.originalMessage);
          }
        }
      }

    }.bind(this))
  }

  pushReferencesForComponent(component) {
    console.log("Called push references for comp", component);
    for(var contextHandler of this.contextHandlers) {
      if(contextHandler.component !== component) {
        continue;
      }
      var observer = _.find(this.streamReferencesObservers, {component: component});
      if(!observer) {
        continue;
      }
      var itemInContext = contextHandler.handler();
      this.sendReferencesInReply(component, itemInContext.referenceParams(), observer.originalMessage);
    }
  }

  loadComponentStateForArea(area) {
    for(var component of this.components) {
      if(component.area === area && component.active) {
        this.activateComponent(component);
      }
    }
  }

  referencesDidChangeInContextOfComponent(component) {
    this.pushReferencesForComponent(component);
  }

  jsonForItem(item) {
    var params = {uuid: item.uuid, content_type: item.content_type, created_at: item.created_at, updated_at: item.updated_at, deleted: item.deleted};
    params.content = item.createContentJSONFromProperties();
    return params;
  }

  sendItemsInReply(component, items, message) {
    var response = {items: {}};
    var mapped = items.map(function(item) {
      return this.jsonForItem(item);
    }.bind(this));

    response.items = mapped;
    this.replyToMessage(component, message, response);
  }

  sendReferencesInReply(component, references, originalMessage) {
    var response = {references: references};
    this.replyToMessage(component, originalMessage, response);
  }

  get components() {
    return this.modelManager.itemsForContentType("SN|Component");
  }

  componentForSessionKey(key) {
    return _.find(this.components, {sessionKey: key});
  }

  handleMessage(component, message) {

    if(!component) {
      console.log("Component not defined, returning");
      return;
    }

    /**
    Possible Messages:
    set-size
    stream-items
    stream-references
    save-items
    select-item
    associate-item
    deassociate-item
    clear-selection
    create-item
    delete-item
    */

    if(message.action === "stream-items") {
      this.handleStreamItemsMessage(component, message);
    }

    else if(message.action === "stream-references") {
      // stream references of current context
      this.handleStreamReferencesMessage(component, message);
    }

    else if(message.action === "delete-item") {
      if(confirm("Are you sure you want to delete this item?")) {
        var item = this.modelManager.findItem(message.data.item.uuid);
        this.modelManager.setItemToBeDeleted(item);
        this.syncManager.sync();
      }
    }

    else if(message.action === "create-item") {
      var item = this.modelManager.createItem(message.data.item);
      this.modelManager.addItem(item);
      item.setDirty(true);
      this.syncManager.sync();
      this.replyToMessage(component, message, {item: this.jsonForItem(item)})
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

    for(let observer of this.actionObservers) {
      if(observer.action === message.action && observer.component === component) {
        this.timeout(function(){
          observer.callback(message.data);
        })
      }
    }
  }

  handleStreamItemsMessage(component, message) {

    if(!this.verifyPermissions(component, message.data.content_types)) {
      var result = this.promptForPermissions(component, message.data.content_types);
      if(!result) {
        return;
      }
    }

    if(!_.find(this.streamObservers, {identifier: component.url})) {
      // for pushing laster as changes come in
      this.streamObservers.push({
        identifier: component.url,
        component: component,
        originalMessage: message,
        contentTypes: message.data.content_types
      })
    }


    // push immediately now
    var items = [];
    for(var contentType of message.data.content_types) {
      items = items.concat(this.modelManager.itemsForContentType(contentType));
    }
    this.sendItemsInReply(component, items, message);
  }

  handleStreamReferencesMessage(component, message) {

    if(!_.find(this.streamReferencesObservers, {identifier: component.url})) {
      // for pushing laster as changes come in
      this.streamReferencesObservers.push({
        identifier: component.url,
        component: component,
        originalMessage: message
      })
    }

    // push immediately now
    for(var contextHandler of this.contextHandlers) {
      if(contextHandler.component !== component) {
        continue;
      }
      var itemInContext = contextHandler.handler();
      this.sendReferencesInReply(component, itemInContext.referenceParams(), message);
    }
  }

  promptForPermissions(component, requestedPermissions) {
    var permissions = requestedPermissions.map(function(p){return p + "s"});
    var message = "The following component is requesting access to these items:\n\n";
    message += "Component: " + component.url + "\n\n";
    message += "Items: " + permissions.join(", ");
    if(confirm(message)) {
      component.permissions = requestedPermissions;
      component.setDirty(true);
      this.syncManager.sync();
      return true;
    } else {
      return false;
    }
  }

  verifyPermissions(component, requestedPermissions) {
    if(!component.permissions) {
      return false;
    }
    return JSON.stringify(component.permissions.sort()) === JSON.stringify(requestedPermissions.sort());
  }

  replyToMessage(component, originalMessage, replyData) {
    var reply = {
      action: "reply",
      original: originalMessage,
      data: replyData
    }

    this.sendMessageToComponent(component, reply);
  }

  sendMessageToComponent(component, message) {
    component.window.postMessage(message, "*");
  }

  addActionObserver(identifier, component, action, callback) {
    if(_.find(this.actionObservers, {identifier: identifier})) {
      return;
    }
    this.actionObservers.push({
      identifier: identifier,
      component: component,
      action: action,
      callback: callback
    })
  }

  addActivationObserver(identifier, area, callback) {
    if(!_.find(this.activationObservers, {identifier: identifier})) {
      this.activationObservers.push({
        identifier: identifier,
        area: area,
        callback: callback
      })
    }
  }

  addContextRequestHandler(identifier, component, handler) {
    if(!_.find(this.contextHandlers, {identifier: identifier})) {
      this.contextHandlers.push({
        identifier: identifier,
        component: component,
        handler: handler,
      })
    }
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
    var didChange = component.active != true;

    component.active = true;
    this.activationObservers.forEach(function(observer){
      if(observer.area == component.area) {
        observer.callback(component);
      }
    })

    if(didChange) {
      component.setDirty(true);
      this.syncManager.sync();
    }
  }

  // Called by other views when the iframe is ready
  registerComponentWindow(component, componentWindow) {
    component.window = componentWindow;
    component.sessionKey = Neeto.crypto.generateUUID();
    this.sendMessageToComponent(component, {action: "component-registered", sessionKey: component.sessionKey});
  }

  deactivateComponent(component) {
    var didChange = component.active != false;
    component.active = false;
    component.sessionKey = null;
    this.activationObservers.forEach(function(observer){
      if(observer.area == component.area) {
        observer.callback(component);
      }
    })

    if(didChange) {
      component.setDirty(true);
      this.syncManager.sync();
    }

    // remove observers and handlers for this component (except for activation handler)

    this.contextHandlers = this.contextHandlers.filter(function(h){
      return h.component !== component;
    })

    this.actionObservers = this.actionObservers.filter(function(o){
      return o.component !== component;
    })

    this.streamObservers = this.streamObservers.filter(function(o){
      return o.component !== component;
    })

    this.streamReferencesObservers = this.streamReferencesObservers.filter(function(o){
      return o.component !== component;
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

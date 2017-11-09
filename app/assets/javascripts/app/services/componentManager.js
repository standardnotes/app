class ComponentManager {

  constructor($rootScope, modelManager, syncManager, themeManager, $timeout, $compile) {
    this.$compile = $compile;
    this.$rootScope = $rootScope;
    this.modelManager = modelManager;
    this.syncManager = syncManager;
    this.themeManager = themeManager;
    this.timeout = $timeout;
    this.streamObservers = [];
    this.contextStreamObservers = [];
    this.activeComponents = [];

    // this.loggingEnabled = true;

    this.permissionDialogs = [];

    this.handlers = [];

    $rootScope.$on("theme-changed", function(){
      this.postThemeToComponents();
    }.bind(this))

    window.addEventListener("message", function(event){
      if(this.loggingEnabled) {
        console.log("Web app: received message", event);
      }
      this.handleMessage(this.componentForSessionKey(event.data.sessionKey), event.data);
    }.bind(this), false);

    this.modelManager.addItemSyncObserver("component-manager", "*", function(allItems, validItems, deletedItems) {

      var syncedComponents = allItems.filter(function(item){return item.content_type === "SN|Component" });
      for(var component of syncedComponents) {
        var activeComponent = _.find(this.activeComponents, {uuid: component.uuid});
        if(component.active && !component.deleted && !activeComponent) {
          this.activateComponent(component);
        } else if(!component.active && activeComponent) {
          this.deactivateComponent(component);
        }
      }

      for(let observer of this.streamObservers) {
        var relevantItems = allItems.filter(function(item){
          return observer.contentTypes.indexOf(item.content_type) !== -1;
        })

        var requiredPermissions = [
          {
            name: "stream-items",
            content_types: observer.contentTypes.sort()
          }
        ];

        this.runWithPermissions(observer.component, requiredPermissions, observer.originalMessage.permissions, function(){
          this.sendItemsInReply(observer.component, relevantItems, observer.originalMessage);
        }.bind(this))
      }

      var requiredContextPermissions = [
        {
          name: "stream-context-item"
        }
      ];

      for(let observer of this.contextStreamObservers) {
        this.runWithPermissions(observer.component, requiredContextPermissions, observer.originalMessage.permissions, function(){
          for(let handler of this.handlers) {
            if(!handler.areas.includes(observer.component.area)) {
              continue;
            }
            var itemInContext = handler.contextRequestHandler(observer.component);
            if(itemInContext) {
              var matchingItem = _.find(allItems, {uuid: itemInContext.uuid});
              if(matchingItem) {
                this.sendContextItemInReply(observer.component, matchingItem, observer.originalMessage);
              }
            }
          }
        }.bind(this))
      }
    }.bind(this))
  }

  postThemeToComponents() {
    for(var component of this.components) {
      if(!component.active || !component.window) {
        continue;
      }
      this.postThemeToComponent(component);
    }
  }

  postThemeToComponent(component) {
    var data = {
      themes: [this.themeManager.currentTheme ? this.themeManager.currentTheme.url : null]
    }

    this.sendMessageToComponent(component, {action: "themes", data: data})
  }

  contextItemDidChangeInArea(area) {
    for(let handler of this.handlers) {
      if(handler.areas.includes(area) === false) {
        continue;
      }
      var observers = this.contextStreamObservers.filter(function(observer){
        return observer.component.area === area;
      })

      for(let observer of observers) {
        var itemInContext = handler.contextRequestHandler(observer.component);
        this.sendContextItemInReply(observer.component, itemInContext, observer.originalMessage);
      }
    }
  }

  jsonForItem(item) {
    var params = {uuid: item.uuid, content_type: item.content_type, created_at: item.created_at, updated_at: item.updated_at, deleted: item.deleted};
    params.content = item.createContentJSONFromProperties();
    return params;
  }

  sendItemsInReply(component, items, message) {
    if(this.loggingEnabled) {console.log("Web|componentManager|sendItemsInReply", component, items, message)};
    var response = {items: {}};
    var mapped = items.map(function(item) {
      return this.jsonForItem(item);
    }.bind(this));

    response.items = mapped;
    this.replyToMessage(component, message, response);
  }

  sendContextItemInReply(component, item, originalMessage) {
    if(this.loggingEnabled) {console.log("Web|componentManager|sendContextItemInReply", component, item, originalMessage)};
    var response = {item: this.jsonForItem(item)};
    this.replyToMessage(component, originalMessage, response);
  }

  get components() {
    return this.modelManager.itemsForContentType("SN|Component");
  }

  componentsForArea(area) {
    return this.components.filter(function(component){
      return component.area === area;
    })
  }

  componentForUrl(url) {
    return this.components.filter(function(component){
      return component.url === url;
    })[0];
  }

  componentForSessionKey(key) {
    return _.find(this.components, {sessionKey: key});
  }

  handleMessage(component, message) {

    if(!component) {
      if(this.loggingEnabled) {
        console.log("Component not defined, returning");
      }
      return;
    }

    /**
    Possible Messages:
    set-size
    stream-items
    stream-context-item
    save-items
    select-item
    associate-item
    deassociate-item
    clear-selection
    create-item
    delete-items
    set-component-data
    */

    if(message.action === "stream-items") {
      this.handleStreamItemsMessage(component, message);
    }

    else if(message.action === "stream-context-item") {
      this.handleStreamContextItemMessage(component, message);
    }

    else if(message.action === "set-component-data") {
      component.componentData = message.data.componentData;
      component.setDirty(true);
      this.syncManager.sync();
    }

    else if(message.action === "delete-items") {
      var items = message.data.items;
      var noun = items.length == 1 ? "item" : "items";
      if(confirm(`Are you sure you want to delete ${items.length} ${noun}?`)) {
        for(var item of items) {
          var model = this.modelManager.findItem(item.uuid);
          this.modelManager.setItemToBeDeleted(model);
        }

        this.syncManager.sync();
      }
    }

    else if(message.action === "create-item") {
      var item = this.modelManager.createItem(message.data.item);
      this.modelManager.addItem(item);
      this.modelManager.resolveReferencesForItem(item);
      item.setDirty(true);
      this.syncManager.sync();
      this.replyToMessage(component, message, {item: this.jsonForItem(item)})
    }

    else if(message.action === "save-items") {
      var responseItems = message.data.items;

      /*
        We map the items here because modelManager is what updatese the UI. If you were to instead get the items directly,
        this would update them server side via sync, but would never make its way back to the UI.
       */
      var localItems = this.modelManager.mapResponseItemsToLocalModels(responseItems);

      for(var item of localItems) {
        var responseItem = _.find(responseItems, {uuid: item.uuid});
        _.merge(item.content, responseItem.content);
        item.setDirty(true);
      }
      this.syncManager.sync((response) => {
        // Allow handlers to be notified when a save begins and ends, to update the UI
        var saveMessage = Object.assign({}, message);
        saveMessage.action = response && response.error ? "save-error" : "save-success";
        this.handleMessage(component, saveMessage);
      });
    }

    for(let handler of this.handlers) {
      if(handler.areas.includes(component.area)) {
        this.timeout(function(){
          handler.actionHandler(component, message.action, message.data);
        })
      }
    }
  }

  handleStreamItemsMessage(component, message) {
    var requiredPermissions = [
      {
        name: "stream-items",
        content_types: message.data.content_types.sort()
      }
    ];

    this.runWithPermissions(component, requiredPermissions, message.permissions, function(){
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
    }.bind(this));
  }

  handleStreamContextItemMessage(component, message) {

    var requiredPermissions = [
      {
        name: "stream-context-item"
      }
    ];

    this.runWithPermissions(component, requiredPermissions, message.permissions, function(){
      if(!_.find(this.contextStreamObservers, {identifier: component.url})) {
        // for pushing laster as changes come in
        this.contextStreamObservers.push({
          identifier: component.url,
          component: component,
          originalMessage: message
        })
      }

      // push immediately now
      for(let handler of this.handlers) {
        if(handler.areas.includes(component.area) === false) {
          continue;
        }
        var itemInContext = handler.contextRequestHandler(component);
        this.sendContextItemInReply(component, itemInContext, message);
      }
    }.bind(this))
  }

  runWithPermissions(component, requiredPermissions, requestedPermissions, runFunction) {

    var acquiredPermissions = component.permissions;

    var requestedMatchesRequired = true;

    for(var required of requiredPermissions) {
      var matching = _.find(requestedPermissions, required);
      if(!matching) {
        requestedMatchesRequired = false;
        break;
      }
    }

    if(!requestedMatchesRequired) {
      // Error with Component permissions request
      console.error("You are requesting permissions", requestedPermissions, "when you need to be requesting", requiredPermissions, ". Component:", component);
      return;
    }

    if(!component.permissions) {
      component.permissions = [];
    }

    var acquiredMatchesRequested = angular.toJson(component.permissions.sort()) === angular.toJson(requestedPermissions.sort());

    if(!acquiredMatchesRequested) {
      this.promptForPermissions(component, requestedPermissions, function(approved){
        if(approved) {
          runFunction();
        }
      });
    } else {
      runFunction();
    }
  }

  promptForPermissions(component, requestedPermissions, callback) {
    // since these calls are asyncronous, multiple dialogs may be requested at the same time. We only want to present one and trigger all callbacks based on one modal result
    var existingDialog = _.find(this.permissionDialogs, {component: component});

    component.trusted = component.url.startsWith("https://standardnotes.org") || component.url.startsWith("https://extensions.standardnotes.org");
    var scope = this.$rootScope.$new(true);
    scope.component = component;
    scope.permissions = requestedPermissions;
    scope.actionBlock = callback;

    scope.callback = function(approved) {
      if(approved) {
        component.permissions = requestedPermissions;
        component.setDirty(true);
        this.syncManager.sync();
      }

      for(var existing of this.permissionDialogs) {
        if(existing.component === component && existing.actionBlock) {
          existing.actionBlock(approved);
        }
      }

      this.permissionDialogs = this.permissionDialogs.filter(function(dialog){
        return dialog.component !== component;
      })

    }.bind(this);

    this.permissionDialogs.push(scope);

    if(!existingDialog) {
      var el = this.$compile( "<permissions-modal component='component' permissions='permissions' callback='callback' class='permissions-modal'></permissions-modal>" )(scope);
      angular.element(document.body).append(el);
    } else {
      console.log("Existing dialog, not presenting.");
    }
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
    if(component.ignoreEvents && message.action !== "component-registered") {
      if(this.loggingEnabled) {
        console.log("Component disabled for current item, not sending any messages.", component.name);
      }
      return;
    }
    if(this.loggingEnabled) {
      console.log("Web|sendMessageToComponent", component, message);
    }
    component.window.postMessage(message, "*");
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
    for(var handler of this.handlers) {
      if(handler.areas.includes(component.area)) {
        handler.activationHandler(component);
      }
    }

    if(didChange) {
      component.setDirty(true);
      this.syncManager.sync();
    }

    if(!this.activeComponents.includes(component)) {
      this.activeComponents.push(component);
    }
  }

  registerHandler(handler) {
    this.handlers.push(handler);
  }

  // Called by other views when the iframe is ready
  registerComponentWindow(component, componentWindow) {
    if(component.window === componentWindow) {
      if(this.loggingEnabled) {
        console.log("Web|componentManager", "attempting to re-register same component window.")
      }
    }

    if(this.loggingEnabled) {
      console.log("Web|componentManager|registerComponentWindow", component);
    }
    component.window = componentWindow;
    component.sessionKey = Neeto.crypto.generateUUID();
    this.sendMessageToComponent(component, {action: "component-registered", sessionKey: component.sessionKey, componentData: component.componentData});
    this.postThemeToComponent(component);
  }

  deactivateComponent(component) {
    var didChange = component.active != false;
    component.active = false;
    component.sessionKey = null;

    for(var handler of this.handlers) {
      if(handler.areas.includes(component.area)) {
        handler.activationHandler(component);
      }
    }

    if(didChange) {
      component.setDirty(true);
      this.syncManager.sync();
    }

    _.pull(this.activeComponents, component);

    this.streamObservers = this.streamObservers.filter(function(o){
      return o.component !== component;
    })

    this.contextStreamObservers = this.contextStreamObservers.filter(function(o){
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

  disassociateComponentWithItem(component, item) {
    _.pull(component.associatedItemIds, item.uuid);

    if(component.disassociatedItemIds.indexOf(item.uuid) !== -1) {
      return;
    }

    component.disassociatedItemIds.push(item.uuid);
    
    component.setDirty(true);
    this.syncManager.sync();
  }

  associateComponentWithItem(component, item) {
    _.pull(component.disassociatedItemIds, item.uuid);

    if(component.associatedItemIds.includes(item.uuid)) {
      return;
    }

    component.associatedItemIds.push(item.uuid);

    component.setDirty(true);
    this.syncManager.sync();
  }

  enableComponentsForItem(components, item) {
    for(var component of components) {
      _.pull(component.disassociatedItemIds, item.uuid);
      component.setDirty(true);
    }
    this.syncManager.sync();
  }

  setEventFlowForComponent(component, on) {
    component.ignoreEvents = !on;
  }

  iframeForComponent(component) {
    for(var frame of document.getElementsByTagName("iframe")) {
      var componentId = frame.dataset.componentId;
      if(componentId === component.uuid) {
        return frame;
      }
    }
  }


}

angular.module('app.frontend').service('componentManager', ComponentManager);

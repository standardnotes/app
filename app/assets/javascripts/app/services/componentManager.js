/* This domain will be used to save context item client data */
let ClientDataDomain = "org.standardnotes.sn.components";

class ComponentManager {

  constructor($rootScope, modelManager, syncManager, desktopManager, $timeout, $compile) {
    this.$compile = $compile;
    this.$rootScope = $rootScope;
    this.modelManager = modelManager;
    this.syncManager = syncManager;
    this.desktopManager = desktopManager;
    this.timeout = $timeout;
    this.streamObservers = [];
    this.contextStreamObservers = [];
    this.activeComponents = [];

    // this.loggingEnabled = true;

    this.permissionDialogs = [];

    this.handlers = [];

    // $rootScope.$on("theme-changed", function(){
    //   this.postThemeToAllComponents();
    // }.bind(this))

    window.addEventListener("message", function(event){
      if(this.loggingEnabled) {
        console.log("Web app: received message", event);
      }
      this.handleMessage(this.componentForSessionKey(event.data.sessionKey), event.data);
    }.bind(this), false);

    this.modelManager.addItemSyncObserver("component-manager", "*", (allItems, validItems, deletedItems, source) => {

      /* If the source of these new or updated items is from a Component itself saving items, we don't need to notify
        components again of the same item. Regarding notifying other components than the issuing component, other mapping sources
        will take care of that, like ModelManager.MappingSourceRemoteSaved
       */
      if(source == ModelManager.MappingSourceComponentRetrieved) {
        return;
      }

      var syncedComponents = allItems.filter(function(item) {
        return item.content_type === "SN|Component" || item.content_type == "SN|Theme"
      });

      /* We only want to sync if the item source is Retrieved, not MappingSourceRemoteSaved to avoid
        recursion caused by the component being modified and saved after it is updated.
      */
      if(syncedComponents.length > 0 && source != ModelManager.MappingSourceRemoteSaved) {
        // Ensure any component in our data is installed by the system
        this.desktopManager.syncComponentsInstallation(syncedComponents);
      }

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

        if(relevantItems.length == 0) {
          continue;
        }

        var requiredPermissions = [
          {
            name: "stream-items",
            content_types: observer.contentTypes.sort()
          }
        ];

        this.runWithPermissions(observer.component, requiredPermissions, () => {
          console.log("Stream observer, sending items", relevantItems);
          this.sendItemsInReply(observer.component, relevantItems, observer.originalMessage);
        })
      }

      var requiredContextPermissions = [
        {
          name: "stream-context-item"
        }
      ];

      for(let observer of this.contextStreamObservers) {
        for(let handler of this.handlers) {
          if(!handler.areas.includes(observer.component.area) && !handler.areas.includes("*")) {
            continue;
          }
          if(handler.contextRequestHandler) {
            var itemInContext = handler.contextRequestHandler(observer.component);
            if(itemInContext) {
              var matchingItem = _.find(allItems, {uuid: itemInContext.uuid});
              if(matchingItem) {
                this.runWithPermissions(observer.component, requiredContextPermissions, () => {
                  this.sendContextItemInReply(observer.component, matchingItem, observer.originalMessage, source);
                })
              }
            }
          }
        }
      }
    });
  }

  postThemeToAllComponents() {
    for(var component of this.components) {
      if(component.area == "themes" || !component.active || !component.window) {
        continue;
      }
      this.postThemeToComponent(component);
    }
  }

  getActiveTheme() {
    return this.componentsForArea("themes").find((theme) => {return theme.active});
  }

  postThemeToComponent(component) {
    var activeTheme = this.getActiveTheme();
    var data = {
      themes: [activeTheme ? this.urlForComponent(activeTheme) : null]
    }

    this.sendMessageToComponent(component, {action: "themes", data: data})
  }

  contextItemDidChangeInArea(area) {
    for(let handler of this.handlers) {
      if(handler.areas.includes(area) === false && !handler.areas.includes("*")) {
        continue;
      }
      var observers = this.contextStreamObservers.filter(function(observer){
        return observer.component.area === area;
      })

      for(let observer of observers) {
        if(handler.contextRequestHandler) {
          var itemInContext = handler.contextRequestHandler(observer.component);
          this.sendContextItemInReply(observer.component, itemInContext, observer.originalMessage);
        }
      }
    }
  }

  jsonForItem(item, component, source) {
    var params = {uuid: item.uuid, content_type: item.content_type, created_at: item.created_at, updated_at: item.updated_at, deleted: item.deleted};
    params.content = item.createContentJSONFromProperties();
    /* Legacy is using component.url key, so if it's present, use it, otherwise use uuid */
    params.clientData = item.getDomainDataItem(component.url || component.uuid, ClientDataDomain) || {};

    /* This means the this function is being triggered through a remote Saving response, which should not update
      actual local content values. The reason is, Save responses may be delayed, and a user may have changed some values
      in between the Save was initiated, and the time it completes. So we only want to update actual content values (and not just metadata)
      when its another source, like ModelManager.MappingSourceRemoteRetrieved.
     */
    if(source && source == ModelManager.MappingSourceRemoteSaved) {
      params.isMetadataUpdate = true;
    }
    this.removePrivatePropertiesFromResponseItems([params]);
    return params;
  }

  sendItemsInReply(component, items, message, source) {
    if(this.loggingEnabled) {console.log("Web|componentManager|sendItemsInReply", component, items, message)};
    var response = {items: {}};
    var mapped = items.map(function(item) {
      return this.jsonForItem(item, component, source);
    }.bind(this));

    response.items = mapped;
    this.replyToMessage(component, message, response);
  }

  sendContextItemInReply(component, item, originalMessage, source) {
    if(this.loggingEnabled) {console.log("Web|componentManager|sendContextItemInReply", component, item, originalMessage)};
    var response = {item: this.jsonForItem(item, component, source)};
    this.replyToMessage(component, originalMessage, response);
  }

  get components() {
    return this.modelManager.allItemsMatchingTypes(["SN|Component", "SN|Theme"]);
  }

  componentsForArea(area) {
    return this.components.filter(function(component){
      return component.area === area;
    })
  }

  urlForComponent(component) {
    if(component.offlineOnly || (isDesktopApplication() && component.local_url)) {
      return component.local_url.replace("sn://", this.desktopManager.getApplicationDataPath() + "/");
    } else {
      return component.url || component.hosted_url;
    }
  }

  componentForUrl(url) {
    return this.components.filter(function(component){
      return component.url === url || component.hosted_url === url;
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
      save-context-client-data
      get-context-client-data
      install-local-component
      toggle-activate-component
    */

    if(message.action === "stream-items") {
      this.handleStreamItemsMessage(component, message);
    } else if(message.action === "stream-context-item") {
      this.handleStreamContextItemMessage(component, message);
    } else if(message.action === "set-component-data") {
      this.handleSetComponentDataMessage(component, message);
    } else if(message.action === "delete-items") {
      this.handleDeleteItemsMessage(component, message);
    } else if(message.action === "create-item") {
      this.handleCreateItemMessage(component, message);
    } else if(message.action === "save-items") {
      this.handleSaveItemsMessage(component, message);
    } else if(message.action === "toggle-activate-component") {
      let componentToToggle = this.modelManager.findItem(message.data.uuid);
      this.handleToggleComponentMessage(component, componentToToggle, message);
    }

    // Notify observers
    for(let handler of this.handlers) {
      if(handler.areas.includes(component.area) || handler.areas.includes("*")) {
        this.timeout(function(){
          handler.actionHandler(component, message.action, message.data);
        })
      }
    }
  }

  removePrivatePropertiesFromResponseItems(responseItems, includeUrls) {
    // Don't allow component to overwrite these properties.
    var privateProperties = ["appData", "autoupdateDisabled", "permissions", "active", "encrypted"];
    if(includeUrls) {
      privateProperties = privateProperties.concat(["url", "hosted_url", "local_url"]);
    }
    for(var responseItem of responseItems) {

      // Do not pass in actual items here, otherwise that would be destructive.
      // Instead, generic JS/JSON objects should be passed.
      console.assert(typeof responseItem.setDirty !== 'function');

      for(var prop of privateProperties) {
        delete responseItem[prop];
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

    this.runWithPermissions(component, requiredPermissions, () => {
      if(!_.find(this.streamObservers, {identifier: component.uuid})) {
        // for pushing laster as changes come in
        this.streamObservers.push({
          identifier: component.uuid,
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
    });
  }

  handleStreamContextItemMessage(component, message) {

    var requiredPermissions = [
      {
        name: "stream-context-item"
      }
    ];

    this.runWithPermissions(component, requiredPermissions, function(){
      if(!_.find(this.contextStreamObservers, {identifier: component.uuid})) {
        // for pushing laster as changes come in
        this.contextStreamObservers.push({
          identifier: component.uuid,
          component: component,
          originalMessage: message
        })
      }

      // push immediately now
      for(let handler of this.handlersForArea(component.area)) {
        if(handler.contextRequestHandler) {
          var itemInContext = handler.contextRequestHandler(component);
          this.sendContextItemInReply(component, itemInContext, message);
        }
      }
    }.bind(this))
  }

  isItemWithinComponentContextJurisdiction(item, component) {
    for(let handler of this.handlersForArea(component.area)) {
      if(handler.contextRequestHandler) {
        var itemInContext = handler.contextRequestHandler(component);
        if(itemInContext.uuid == item.uuid) {
          return true;
        }
      }
    }
    return false;
  }

  handlersForArea(area) {
    return this.handlers.filter((candidate) => {return candidate.areas.includes(area)});
  }

  handleSaveItemsMessage(component, message) {
    var responseItems = message.data.items;
    var requiredPermissions;

    // Check if you're just trying to save the context item, which requires only stream-context-item permissions
    if(responseItems.length == 1 && this.isItemWithinComponentContextJurisdiction(responseItems[0], component)) {
      requiredPermissions = [
        {
          name: "stream-context-item"
        }
      ];
    } else {
      var requiredContentTypes = _.uniq(responseItems.map((i) => {return i.content_type})).sort();
      requiredPermissions = [
        {
          name: "stream-items",
          content_types: requiredContentTypes
        }
      ];
    }

    this.runWithPermissions(component, requiredPermissions, () => {

      this.removePrivatePropertiesFromResponseItems(responseItems, {includeUrls: true});

      /*
      We map the items here because modelManager is what updates the UI. If you were to instead get the items directly,
      this would update them server side via sync, but would never make its way back to the UI.
      */
      var localItems = this.modelManager.mapResponseItemsToLocalModels(responseItems, ModelManager.MappingSourceComponentRetrieved);

      for(var item of localItems) {
        var responseItem = _.find(responseItems, {uuid: item.uuid});
        _.merge(item.content, responseItem.content);
        if(responseItem.clientData) {
          item.setDomainDataItem(component.url || component.uuid, responseItem.clientData, ClientDataDomain);
        }
        item.setDirty(true);
      }

      this.syncManager.sync((response) => {
        // Allow handlers to be notified when a save begins and ends, to update the UI
        var saveMessage = Object.assign({}, message);
        saveMessage.action = response && response.error ? "save-error" : "save-success";
        this.handleMessage(component, saveMessage);
      });
    });
  }

  handleCreateItemMessage(component, message) {
    var requiredPermissions = [
      {
        name: "stream-items",
        content_types: [message.data.item.content_type]
      }
    ];

    this.runWithPermissions(component, requiredPermissions, () => {
      var responseItem = message.data.item;
      this.removePrivatePropertiesFromResponseItems([responseItem]);
      var item = this.modelManager.createItem(responseItem);
      if(responseItem.clientData) {
        item.setDomainDataItem(component.url || component.uuid, responseItem.clientData, ClientDataDomain);
      }
      this.modelManager.addItem(item);
      this.modelManager.resolveReferencesForItem(item);
      item.setDirty(true);
      this.syncManager.sync();
      this.replyToMessage(component, message, {item: this.jsonForItem(item, component)})
    });
  }

  handleDeleteItemsMessage(component, message) {
    var requiredContentTypes = _.uniq(message.data.items.map((i) => {return i.content_type})).sort();
    var requiredPermissions = [
      {
        name: "stream-items",
        content_types: requiredContentTypes
      }
    ];

    this.runWithPermissions(component, requiredPermissions, () => {
      var items = message.data.items;
      var noun = items.length == 1 ? "item" : "items";
      if(confirm(`Are you sure you want to delete ${items.length} ${noun}?`)) {
        for(var item of items) {
          var model = this.modelManager.findItem(item.uuid);
          this.modelManager.setItemToBeDeleted(model);
        }

        this.syncManager.sync();
      }
    });
  }

  handleSetComponentDataMessage(component, message) {
    // A component setting its own data does not require special permissions
    this.runWithPermissions(component, [], () => {
      component.componentData = message.data.componentData;
      component.setDirty(true);
      this.syncManager.sync();
    });
  }


  handleToggleComponentMessage(sourceComponent, targetComponent, message) {
    if(targetComponent.area == "modal") {
      this.openModalComponent(targetComponent);
    } else {
      if(targetComponent.active) {
        this.deactivateComponent(targetComponent);
      } else {
        if(targetComponent.content_type == "SN|Theme") {
          // Deactive currently active theme
          var activeTheme = this.getActiveTheme();
          if(activeTheme) {
            this.deactivateComponent(activeTheme);
          }
        }
        this.activateComponent(targetComponent);
      }
    }
  }

  runWithPermissions(component, requiredPermissions, runFunction) {

    if(!component.permissions) {
      component.permissions = [];
    }

    var acquiredPermissions = component.permissions;
    var acquiredMatchesRequired = true;

    for(var required of requiredPermissions) {
      var matching = acquiredPermissions.find((candidate) => {
        var matchesContentTypes = true;
        if(candidate.content_types && required.content_types) {
          matchesContentTypes = JSON.stringify(candidate.content_types.sort()) == JSON.stringify(required.content_types.sort());
        }
        return candidate.name == required.name && matchesContentTypes;
      });

      if(!matching) {
        /* Required permissions can be 1 content type, and requestedPermisisons may send an array of content types.
        In the case of an array, we can just check to make sure that requiredPermissions content type is found in the array
        */
        matching = acquiredPermissions.find((candidate) => {
          return Array.isArray(candidate.content_types)
          && Array.isArray(required.content_types)
          && candidate.content_types.containsSubset(required.content_types);
        });

        if(!matching) {
          acquiredMatchesRequired = false;
          break;
        }
      }
    }

    // var acquiredMatchesRequested = angular.toJson(component.permissions.sort()) === angular.toJson(requestedPermissions.sort());

    if(!acquiredMatchesRequired) {
      this.promptForPermissions(component, requiredPermissions, function(approved){
        if(approved) {
          runFunction();
        }
      });
    } else {
      runFunction();
    }
  }

  promptForPermissions(component, permissions, callback) {
    // since these calls are asyncronous, multiple dialogs may be requested at the same time. We only want to present one and trigger all callbacks based on one modal result
    var existingDialog = _.find(this.permissionDialogs, {component: component});

    var scope = this.$rootScope.$new(true);
    scope.component = component;
    scope.permissions = permissions;
    scope.actionBlock = callback;

    scope.callback = function(approved) {
      if(approved) {
        for(var permission of permissions) {
          if(!component.permissions.includes(permission)) {
            component.permissions.push(permission);
          }
        }
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
      var el = this.$compile( "<permissions-modal component='component' permissions='permissions' callback='callback' class='modal'></permissions-modal>" )(scope);
      angular.element(document.body).append(el);
    } else {
      console.log("Existing dialog, not presenting.");
    }
  }

  openModalComponent(component) {
    var scope = this.$rootScope.$new(true);
    scope.component = component;
    scope.onDismiss = () => {

    }
    var el = this.$compile( "<component-modal component='component' class='modal'></component-modal>" )(scope);
    angular.element(document.body).append(el);
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
      if(handler.areas.includes(component.area) || handler.areas.includes("*")) {
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

    if(component.area == "themes") {
      this.postThemeToAllComponents();
    }
  }

  registerHandler(handler) {
    this.handlers.push(handler);
  }

  deregisterHandler(identifier) {
    var handler = _.find(this.handlers, {identifier: identifier});
    this.handlers.splice(this.handlers.indexOf(handler), 1);
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
    this.sendMessageToComponent(component, {
      action: "component-registered",
      sessionKey: component.sessionKey,
      componentData: component.componentData,
      data: {
        environment: isDesktopApplication() ? "desktop" : "web"
      }
    });
    this.postThemeToComponent(component);
  }

  deactivateComponent(component) {
    var didChange = component.active != false;
    component.active = false;
    component.sessionKey = null;

    for(var handler of this.handlers) {
      if(handler.areas.includes(component.area) || handler.areas.includes("*")) {
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

    if(component.area == "themes") {
      this.postThemeToAllComponents();
    }
  }

  deleteComponent(component) {
    this.modelManager.setItemToBeDeleted(component);
    this.syncManager.sync();
  }

  isComponentActive(component) {
    return component.active;
  }

  iframeForComponent(component) {
    for(var frame of document.getElementsByTagName("iframe")) {
      var componentId = frame.dataset.componentId;
      if(componentId === component.uuid) {
        return frame;
      }
    }
  }

  handleSetSizeEvent(component, data) {
    var setSize = function(element, size) {
      var widthString = typeof size.width === 'string' ? size.width : `${data.width}px`;
      var heightString = typeof size.height === 'string' ? size.height : `${data.height}px`;
      element.setAttribute("style", `width:${widthString}; height:${heightString}; `);
    }

    if(data.type === "content") {
      var iframe = this.iframeForComponent(component);
      var width = data.width;
      var height = data.height;
      iframe.width  = width;
      iframe.height = height;

      setSize(iframe, data);
    } else {
      var container = document.getElementById("component-" + component.uuid);
      setSize(container, data);
    }
  }


}

angular.module('app.frontend').service('componentManager', ComponentManager);

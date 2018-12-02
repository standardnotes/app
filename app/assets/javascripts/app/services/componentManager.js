
class ComponentManager {

  constructor($rootScope, modelManager, syncManager, desktopManager, nativeExtManager, $timeout, $compile) {
    /* This domain will be used to save context item client data */
    ComponentManager.ClientDataDomain = "org.standardnotes.sn.components";

    this.$compile = $compile;
    this.$rootScope = $rootScope;
    this.modelManager = modelManager;
    this.syncManager = syncManager;
    this.desktopManager = desktopManager;
    this.nativeExtManager = nativeExtManager;
    this.timeout = $timeout;
    this.streamObservers = [];
    this.contextStreamObservers = [];
    this.activeComponents = [];
    this.componentsRequiringReload = [];

    const detectFocusChange = (event) => {
      for(var component of this.activeComponents) {
        if(document.activeElement == this.iframeForComponent(component)) {
          this.timeout(() => {
            this.focusChangedForComponent(component);
          })
          break;
        }
      }
    }

    window.addEventListener ? window.addEventListener('focus', detectFocusChange, true) : window.attachEvent('onfocusout', detectFocusChange);
    window.addEventListener ? window.addEventListener('blur', detectFocusChange, true) : window.attachEvent('onblur', detectFocusChange);

    desktopManager.registerUpdateObserver((component) => {
      // Reload theme if active
      if(component.active && component.isTheme()) {
        this.postActiveThemeToAllComponents();
      }
    })

    // this.loggingEnabled = true;

    this.permissionDialogs = [];

    this.handlers = [];

    window.addEventListener("message", function(event){
      if(this.loggingEnabled) {
        console.log("Web app: received message", event);
      }

      // Make sure this message is for us
      if(event.data.sessionKey) {
        this.handleMessage(this.componentForSessionKey(event.data.sessionKey), event.data);
      }
    }.bind(this), false);

    document.addEventListener("visibilitychange", function() {
      if(document.visibilityState == "hidden") {
        return;
      }

      this.reloadComponentsRequiringReload();
    }.bind(this));

    this.modelManager.addItemSyncObserver("component-manager", "*", (allItems, validItems, deletedItems, source, sourceKey) => {

      /* If the source of these new or updated items is from a Component itself saving items, we don't need to notify
        components again of the same item. Regarding notifying other components than the issuing component, other mapping sources
        will take care of that, like SFModelManager.MappingSourceRemoteSaved

        Update: We will now check sourceKey to determine whether the incoming change should be sent to
        a component. If sourceKey == component.uuid, it will be skipped. This way, if one component triggers a change,
        it's sent to other components.
       */
      // if(source == SFModelManager.MappingSourceComponentRetrieved) {
      //   return;
      // }

      var syncedComponents = allItems.filter(function(item) {
        return item.content_type === "SN|Component" || item.content_type == "SN|Theme"
      });

      /* We only want to sync if the item source is Retrieved, not MappingSourceRemoteSaved to avoid
        recursion caused by the component being modified and saved after it is updated.
      */
      if(syncedComponents.length > 0 && source != SFModelManager.MappingSourceRemoteSaved) {
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
        if(sourceKey && sourceKey == observer.component.uuid) {
          // Don't notify source of change, as it is the originator, doesn't need duplicate event.
          continue;
        }

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
          this.sendItemsInReply(observer.component, relevantItems, observer.originalMessage);
        })
      }

      var requiredContextPermissions = [
        {
          name: "stream-context-item"
        }
      ];

      for(let observer of this.contextStreamObservers) {
        if(sourceKey && sourceKey == observer.component.uuid) {
          // Don't notify source of change, as it is the originator, doesn't need duplicate event.
          continue;
        }

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

  postActiveThemeToAllComponents() {
    for(var component of this.components) {
      // Skip over components that are themes themselves,
      // or components that are not active, or components that don't have a window
      if(component.isTheme() || !component.active || !component.window) {
        continue;
      }
      this.postActiveThemeToComponent(component);
    }
  }

  getActiveThemes() {
    return this.componentsForArea("themes").filter((theme) => {return theme.active});
  }

  postActiveThemeToComponent(component) {
    var themes = this.getActiveThemes();
    var urls = themes.map((theme) => {
      return this.urlForComponent(theme);
    })
    var data = {
      themes: urls
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
          if(itemInContext) {
            this.sendContextItemInReply(observer.component, itemInContext, observer.originalMessage);
          }
        }
      }
    }
  }

  jsonForItem(item, component, source) {
    var params = {uuid: item.uuid, content_type: item.content_type, created_at: item.created_at, updated_at: item.updated_at, deleted: item.deleted};
    params.content = item.createContentJSONFromProperties();
    params.clientData = item.getDomainDataItem(component.getClientDataKey(), ComponentManager.ClientDataDomain) || {};

    /* This means the this function is being triggered through a remote Saving response, which should not update
      actual local content values. The reason is, Save responses may be delayed, and a user may have changed some values
      in between the Save was initiated, and the time it completes. So we only want to update actual content values (and not just metadata)
      when its another source, like SFModelManager.MappingSourceRemoteRetrieved.

      3/7/18: Add MappingSourceLocalSaved as well to handle fully offline saving. github.com/standardnotes/forum/issues/169
     */
    if(source && (source == SFModelManager.MappingSourceRemoteSaved || source == SFModelManager.MappingSourceLocalSaved)) {
      params.isMetadataUpdate = true;
    }
    this.removePrivatePropertiesFromResponseItems([params], component);
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

  replyToMessage(component, originalMessage, replyData) {
    var reply = {
      action: "reply",
      original: originalMessage,
      data: replyData
    }

    this.sendMessageToComponent(component, reply);
  }

  sendMessageToComponent(component, message) {
    let permissibleActionsWhileHidden = ["component-registered", "themes"];
    if(component.hidden && !permissibleActionsWhileHidden.includes(message.action)) {
      if(this.loggingEnabled) {
        console.log("Component disabled for current item, not sending any messages.", component.name);
      }
      return;
    }

    if(this.loggingEnabled) {
      console.log("Web|sendMessageToComponent", component, message);
    }

    var origin = this.urlForComponent(component, "file://");
    if(!origin.startsWith("http") && !origin.startsWith("file")) {
      // Native extension running in web, prefix current host
      origin = window.location.href + origin;
    }

    if(!component.window) {
      alert(`Standard Notes is trying to communicate with ${component.name}, but an error is occurring. Please restart this extension and try again.`)
    }

    component.window.postMessage(message, origin);
  }

  get components() {
    return this.modelManager.allItemsMatchingTypes(["SN|Component", "SN|Theme"]);
  }

  componentsForArea(area) {
    return this.components.filter(function(component){
      return component.area === area;
    })
  }

  urlForComponent(component, offlinePrefix = "") {
    if(component.offlineOnly || (isDesktopApplication() && component.local_url)) {
      return component.local_url && component.local_url.replace("sn://", offlinePrefix + this.desktopManager.getApplicationDataPath() + "/");
    } else {
      return component.hosted_url || component.legacy_url;
    }
  }

  componentForUrl(url) {
    return this.components.filter(function(component){
      return component.hosted_url === url || component.legacy_url === url;
    })[0];
  }

  componentForSessionKey(key) {
    return _.find(this.components, {sessionKey: key});
  }

  handleMessage(component, message) {

    if(!component) {
      console.log("Component not defined for message, returning", message);
      alert("An extension is trying to communicate with Standard Notes, but there is an error establishing a bridge. Please restart the app and try again.");
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
      create-items
      delete-items
      set-component-data
      install-local-component
      toggle-activate-component
      request-permissions
      present-conflict-resolution
    */

    if(message.action === "stream-items") {
      this.handleStreamItemsMessage(component, message);
    } else if(message.action === "stream-context-item") {
      this.handleStreamContextItemMessage(component, message);
    } else if(message.action === "set-component-data") {
      this.handleSetComponentDataMessage(component, message);
    } else if(message.action === "delete-items") {
      this.handleDeleteItemsMessage(component, message);
    } else if(message.action === "create-items" || message.action === "create-item") {
      this.handleCreateItemsMessage(component, message);
    } else if(message.action === "save-items") {
      this.handleSaveItemsMessage(component, message);
    } else if(message.action === "toggle-activate-component") {
      let componentToToggle = this.modelManager.findItem(message.data.uuid);
      this.handleToggleComponentMessage(component, componentToToggle, message);
    } else if(message.action === "request-permissions") {
      this.handleRequestPermissionsMessage(component, message);
    } else if(message.action === "install-local-component") {
      this.handleInstallLocalComponentMessage(component, message);
    } else if(message.action === "present-conflict-resolution") {
      this.handlePresentConflictResolutionMessage(component, message);
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


  removePrivatePropertiesFromResponseItems(responseItems, component, options = {}) {
    if(component) {
      // System extensions can bypass this step
      if(this.nativeExtManager.isSystemExtension(component)) {
        return;
      }
    }
    // Don't allow component to overwrite these properties.
    var privateProperties = ["autoupdateDisabled", "permissions", "active"];
    if(options) {
      if(options.includeUrls) { privateProperties = privateProperties.concat(["url", "hosted_url", "local_url"])}
    }
    for(var responseItem of responseItems) {
      // Do not pass in actual items here, otherwise that would be destructive.
      // Instead, generic JS/JSON objects should be passed.
      console.assert(typeof responseItem.setDirty !== 'function');

      for(var prop of privateProperties) {
        delete responseItem.content[prop];
      }
    }
  }

  handlePresentConflictResolutionMessage(component, message) {
    var ids = message.data.item_ids;
    var items = this.modelManager.findItems(ids);
    this.syncManager.presentConflictResolutionModal(items, () => {
      this.replyToMessage(component, message, {});
    });
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
        items = items.concat(this.modelManager.validItemsForContentType(contentType));
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
          if(itemInContext) {
            this.sendContextItemInReply(component, itemInContext, message);
          }
        }
      }
    }.bind(this))
  }

  isItemWithinComponentContextJurisdiction(item, component) {
    for(let handler of this.handlersForArea(component.area)) {
      if(handler.contextRequestHandler) {
        var itemInContext = handler.contextRequestHandler(component);
        if(itemInContext && itemInContext.uuid == item.uuid) {
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

      this.removePrivatePropertiesFromResponseItems(responseItems, component, {includeUrls: true});

      /*
      We map the items here because modelManager is what updates the UI. If you were to instead get the items directly,
      this would update them server side via sync, but would never make its way back to the UI.
      */

      // Filter locked items
      var ids = responseItems.map((i) => {return i.uuid});
      var items = this.modelManager.findItems(ids);
      var lockedCount = 0;
      for(var item of items) {
        if(item.locked) {
          _.remove(responseItems, {uuid: item.uuid});
          lockedCount++;
        }
      }

      if(lockedCount > 0) {
        var itemNoun = lockedCount == 1 ? "item" : "items";
        var auxVerb = lockedCount == 1 ? "is" : "are";
        alert(`${lockedCount} ${itemNoun} you are attempting to save ${auxVerb} locked and cannot be edited.`);
      }

      var localItems = this.modelManager.mapResponseItemsToLocalModels(responseItems, SFModelManager.MappingSourceComponentRetrieved, component.uuid);

      for(var responseItem of responseItems) {
        var item = _.find(localItems, {uuid: responseItem.uuid});
        if(!item) {
          // An item this extension is trying to save was possibly removed locally, notify user
          alert(`The extension ${component.name} is trying to save an item with type ${responseItem.content_type}, but that item does not exist. Please restart this extension and try again.`);
          continue;
        }

        // 8/2018: Why did we have this here? `mapResponseItemsToLocalModels` takes care of merging item content. We definitely shouldn't be doing this directly.
        // _.merge(item.content, responseItem.content);

        if(!item.locked) {
          if(responseItem.clientData) {
            item.setDomainDataItem(component.getClientDataKey(), responseItem.clientData, ComponentManager.ClientDataDomain);
          }
          item.setDirty(true);
        }
      }

      this.syncManager.sync().then((response) => {
        // Allow handlers to be notified when a save begins and ends, to update the UI
        var saveMessage = Object.assign({}, message);
        saveMessage.action = response && response.error ? "save-error" : "save-success";
        this.replyToMessage(component, message, {error: response && response.error})
        this.handleMessage(component, saveMessage);
      });
    });
  }

  handleCreateItemsMessage(component, message) {
    var responseItems = message.data.item ? [message.data.item] : message.data.items;
    let uniqueContentTypes = _.uniq(responseItems.map((item) => {return item.content_type}));
    var requiredPermissions = [
      {
        name: "stream-items",
        content_types: uniqueContentTypes
      }
    ];

    this.runWithPermissions(component, requiredPermissions, () => {
      this.removePrivatePropertiesFromResponseItems(responseItems, component);
      var processedItems = [];
      for(let responseItem of responseItems) {
        var item = this.modelManager.createItem(responseItem);
        if(responseItem.clientData) {
          item.setDomainDataItem(component.getClientDataKey(), responseItem.clientData, ComponentManager.ClientDataDomain);
        }
        this.modelManager.addItem(item);
        this.modelManager.resolveReferencesForItem(item, true);
        item.setDirty(true);
        processedItems.push(item);
      }

      this.syncManager.sync();

      // "create-item" or "create-items" are possible messages handled here
      let reply =
        message.action == "create-item" ?
          {item: this.jsonForItem(processedItems[0], component)}
        :
          {items: processedItems.map((item) => {return this.jsonForItem(item, component)})}

      this.replyToMessage(component, message, reply)
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
      var itemsData = message.data.items;
      var noun = itemsData.length == 1 ? "item" : "items";
      var reply = null;
      if(confirm(`Are you sure you want to delete ${itemsData.length} ${noun}?`)) {
        // Filter for any components and deactivate before deleting
        for(var itemData of itemsData) {
          var model = this.modelManager.findItem(itemData.uuid);
          if(["SN|Component", "SN|Theme"].includes(model.content_type)) {
            this.deactivateComponent(model, true);
          }
          this.modelManager.setItemToBeDeleted(model);
          // Currently extensions are not notified of association until a full server sync completes.
          // We manually notify observers.
          this.modelManager.notifySyncObserversOfModels([model], SFModelManager.MappingSourceRemoteSaved);
        }

        this.syncManager.sync();
        reply = {deleted: true};
      } else {
        // Rejected by user
        reply = {deleted: false};
      }

      this.replyToMessage(component, message, reply)
    });
  }

  handleRequestPermissionsMessage(component, message) {
    this.runWithPermissions(component, message.data.permissions, () => {
      this.replyToMessage(component, message, {approved: true});
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
        if(targetComponent.content_type == "SN|Theme" && !targetComponent.isLayerable()) {
          // Deactive currently active theme if new theme is not layerable
          var activeThemes = this.getActiveThemes();
          for(var theme of activeThemes) {
            if(theme && !theme.isLayerable()) {
              this.deactivateComponent(theme);
            }
          }
        }
        this.activateComponent(targetComponent);
      }
    }
  }

  handleInstallLocalComponentMessage(sourceComponent, message) {
    // Only extensions manager has this permission
    if(!this.nativeExtManager.isSystemExtension(sourceComponent)) {
      return;
    }

    let targetComponent = this.modelManager.findItem(message.data.uuid);
    this.desktopManager.installComponent(targetComponent);
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
          && candidate.content_types.containsPrimitiveSubset(required.content_types);
        });

        if(!matching) {
          acquiredMatchesRequired = false;
          break;
        }
      }
    }

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

      this.permissionDialogs = this.permissionDialogs.filter((pendingDialog) => {
        // Remove self
        if(pendingDialog == scope) {
          pendingDialog.actionBlock && pendingDialog.actionBlock(approved);
          return false;
        }

        if(pendingDialog.component == component) {
          // remove pending dialogs that are encapsulated by already approved permissions, and run its function
          if(pendingDialog.permissions == permissions || permissions.containsObjectSubset(pendingDialog.permissions)) {
            // If approved, run the action block. Otherwise, if canceled, cancel any pending ones as well, since the user was
            // explicit in their intentions
            if(approved) {
              pendingDialog.actionBlock && pendingDialog.actionBlock(approved);
            }
            return false;
          }
        }
        return true;
      })

      if(this.permissionDialogs.length > 0) {
        this.presentDialog(this.permissionDialogs[0]);
      }

    }.bind(this);

    // since these calls are asyncronous, multiple dialogs may be requested at the same time. We only want to present one and trigger all callbacks based on one modal result
    var existingDialog = _.find(this.permissionDialogs, {component: component});

    this.permissionDialogs.push(scope);

    if(!existingDialog) {
      this.presentDialog(scope);
    } else {
      console.log("Existing dialog, not presenting.");
    }
  }

  presentDialog(dialog) {
    var permissions = dialog.permissions;
    var component = dialog.component;
    var callback = dialog.callback;
    var el = this.$compile( "<permissions-modal component='component' permissions='permissions' callback='callback' class='modal'></permissions-modal>" )(dialog);
    angular.element(document.body).append(el);
  }

  openModalComponent(component) {
    var scope = this.$rootScope.$new(true);
    scope.component = component;
    var el = this.$compile( "<component-modal component='component' class='modal'></component-modal>" )(scope);
    angular.element(document.body).append(el);
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
    component.sessionKey = SFJS.crypto.generateUUIDSync();
    this.sendMessageToComponent(component, {
      action: "component-registered",
      sessionKey: component.sessionKey,
      componentData: component.componentData,
      data: {
        uuid: component.uuid,
        environment: isDesktopApplication() ? "desktop" : "web",
        platform: getPlatformString()
      }
    });
    this.postActiveThemeToComponent(component);

    this.desktopManager.notifyComponentActivation(component);
  }

  registerComponentForReload(component) {
    if(!this.componentsRequiringReload.includes(component)) {
      this.componentsRequiringReload.push(component);
    }
  }

  reloadComponentsRequiringReload() {
    let copyOfComponents = this.componentsRequiringReload;

    // reset the componentsRequiringReload array now so that if any have an issue
    // while reloading, they can be re-added to this array during the reloading step
    this.componentsRequiringReload = [];

    // attempt to reload the components
    for(var component of copyOfComponents) {
      this.reloadComponent(component);
    }
  }

  /* Performs func in timeout, but syncronously, if used `await waitTimeout` */
  async waitTimeout(func) {
    return new Promise((resolve, reject) => {
      this.timeout(() => {
        func();
        resolve();
      });
    })
  }


  async activateComponent(component, dontSync = false) {
    var didChange = component.active != true;

    component.active = true;
    for(var handler of this.handlers) {
      if(handler.areas.includes(component.area) || handler.areas.includes("*")) {
        // We want to run the handler in a $timeout so the UI updates, but we also don't want it to run asyncronously
        // so that the steps below this one are run before the handler. So we run in a waitTimeout.
        await this.waitTimeout(() => {
          handler.activationHandler && handler.activationHandler(component);
        })
      }
    }

    if(didChange && !dontSync) {
      component.setDirty(true);
      this.syncManager.sync();
    }

    if(!this.activeComponents.includes(component)) {
      this.activeComponents.push(component);
    }

    if(component.area == "themes") {
      this.postActiveThemeToAllComponents();
    }
  }

  async deactivateComponent(component, dontSync = false) {
    var didChange = component.active != false;
    component.active = false;
    component.sessionKey = null;

    for(let handler of this.handlers) {
      if(handler.areas.includes(component.area) || handler.areas.includes("*")) {
        await this.waitTimeout(() => {
          handler.activationHandler && handler.activationHandler(component);
        })
      }
    }

    if(didChange && !dontSync) {
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
      this.postActiveThemeToAllComponents();
    }
  }

  async reloadComponent(component) {
    //
    // Do soft deactivate
    //
    component.active = false;

    for(let handler of this.handlers) {
      if(handler.areas.includes(component.area) || handler.areas.includes("*")) {
        await this.waitTimeout(() => {
          handler.activationHandler && handler.activationHandler(component);
        })
      }
    }

    this.streamObservers = this.streamObservers.filter(function(o){
      return o.component !== component;
    })

    this.contextStreamObservers = this.contextStreamObservers.filter(function(o){
      return o.component !== component;
    })

    if(component.area == "themes") {
      this.postActiveThemeToAllComponents();
    }

    //
    // Do soft activate
    //

    this.timeout(async () => {
      component.active = true;
      for(var handler of this.handlers) {
        if(handler.areas.includes(component.area) || handler.areas.includes("*")) {
          await this.waitTimeout(() => {
            handler.activationHandler && handler.activationHandler(component);
          })
        }
      }

      if(!this.activeComponents.includes(component)) {
        this.activeComponents.push(component);
      }

      if(component.area == "themes") {
        this.postActiveThemeToAllComponents();
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

  iframeForComponent(component) {
    for(var frame of Array.from(document.getElementsByTagName("iframe"))) {
      var componentId = frame.dataset.componentId;
      if(componentId === component.uuid) {
        return frame;
      }
    }
  }

  focusChangedForComponent(component) {
    let focused = document.activeElement == this.iframeForComponent(component);
    for(var handler of this.handlers) {
      // Notify all handlers, and not just ones that match this component type
      handler.focusHandler && handler.focusHandler(component, focused);
    }
  }

  handleSetSizeEvent(component, data) {
    var setSize = function(element, size) {
      var widthString = typeof size.width === 'string' ? size.width : `${data.width}px`;
      var heightString = typeof size.height === 'string' ? size.height : `${data.height}px`;
      if(element) {
        element.setAttribute("style", `width:${widthString}; height:${heightString};`);
      }
    }

    if(component.area == "rooms" || component.area == "modal") {
      var selector = component.area == "rooms" ? "inner" : "outer";
      var content = document.getElementById(`component-content-${selector}-${component.uuid}`);
      if(content) {
        setSize(content, data);
      }
    } else {
      var iframe = this.iframeForComponent(component);
      if(!iframe) {
        return;
      }
      var width = data.width;
      var height = data.height;
      iframe.width = width;
      iframe.height = height;
      setSize(iframe, data);

      // On Firefox, resizing a component iframe does not seem to have an effect with editor-stack extensions.
      // Sizing the parent does the trick, however, we can't do this globally, otherwise, areas like the note-tags will
      // not be able to expand outside of the bounds (to display autocomplete, for example).
      if(component.area == "editor-stack") {
        let parent = iframe.parentElement;
        if(parent) {
          setSize(parent, data);
        }
      }

      // content object in this case is === to the iframe object above. This is probably
      // legacy code from when we would size content and container individually, which we no longer do.
      // var content = document.getElementById(`component-iframe-${component.uuid}`);
      // console.log("content === iframe", content == iframe);
      // if(content) {
      //   setSize(content, data);
      // }
    }
  }


}

angular.module('app').service('componentManager', ComponentManager);

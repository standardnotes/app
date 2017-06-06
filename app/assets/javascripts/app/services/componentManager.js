class ComponentManager {

  constructor(modelManager, syncManager, $timeout) {
    this.modelManager = modelManager;
    this.syncManager = syncManager;
    this.timeout = $timeout;
    this.selectionObservers = [];
    this.activationObservers = [];

    window.addEventListener("message", function(event){
      console.log("Web app: received message", event);
      this.handleMessage(event, event.data);
    }.bind(this), false);
  }

  get components() {
    return this.modelManager.itemsForContentType("SN|Component");
  }

  handleMessage(event, message) {
    if(message.action === "stream-items") {

      var sendItems = function(items) {
        var response = {items: {}};
        var mapped = _.map(items, function(item){
          var itemParams = new ItemParams(item, null);
          return itemParams.paramsForComponent();
        }.bind(this));

        response.items[contentType] = mapped;
        this.replyToMessage(event, message, response);
      }.bind(this);


      for(var contentType of message.data.content_types) {
        this.modelManager.addItemSyncObserver(event.origin, contentType, function(items){
          sendItems(items);
        }.bind(this))

        var items = this.modelManager.itemsForContentType(contentType);
        sendItems(items);
      }
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

  replyToMessage(event, message, data) {
    var reply = {
      action: "reply",
      original: message,
      data: data
    }
    event.source.postMessage(reply, event.origin)
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
    var component = this.modelManager.createItem({
      content_type: "SN|Component",
      url: url,
      name: name
    })

    this.modelManager.addItem(component);
    component.setDirty(true);
    this.syncManager.sync();
  }

  activateComponent(component) {
    component.active = true;
    this.activationObservers.forEach(function(observer){
      observer.callback(component);
    })
  }

  deactivateComponent(component) {
    component.active = false;
    this.activationObservers.forEach(function(observer){
      observer.callback(component);
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

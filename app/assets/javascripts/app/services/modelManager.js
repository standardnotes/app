class ModelManager {

  constructor(storageManager) {
    ModelManager.MappingSourceRemoteRetrieved = "MappingSourceRemoteRetrieved";
    ModelManager.MappingSourceRemoteSaved = "MappingSourceRemoteSaved";
    ModelManager.MappingSourceLocalSaved = "MappingSourceLocalSaved";
    ModelManager.MappingSourceLocalRetrieved = "MappingSourceLocalRetrieved";
    ModelManager.MappingSourceComponentRetrieved = "MappingSourceComponentRetrieved";
    ModelManager.MappingSourceDesktopInstalled = "MappingSourceDesktopInstalled"; // When a component is installed by the desktop and some of its values change
    ModelManager.MappingSourceRemoteActionRetrieved = "MappingSourceRemoteActionRetrieved"; /* aciton-based Extensions like note history */
    ModelManager.MappingSourceFileImport = "MappingSourceFileImport";

    this.storageManager = storageManager;
    this.notes = [];
    this.tags = [];
    this.itemSyncObservers = [];
    this.itemChangeObservers = [];
    this.itemsPendingRemoval = [];
    this.items = [];
    this._extensions = [];
    this.acceptableContentTypes = [
      "Note", "Tag", "Extension", "SN|Editor", "SN|Theme",
      "SN|Component", "SF|Extension", "SN|UserPreferences", "SF|MFA"
    ];
  }

  resetLocalMemory() {
    this.notes.length = 0;
    this.tags.length = 0;
    this.items.length = 0;
    this._extensions.length = 0;
  }

  get allItems() {
    return this.items.filter(function(item){
      return !item.dummy;
    })
  }

  get extensions() {
    return this._extensions.filter(function(ext){
      return !ext.deleted;
    })
  }

  alternateUUIDForItem(item, callback, removeOriginal) {
    // we need to clone this item and give it a new uuid, then delete item with old uuid from db (you can't mofidy uuid's in our indexeddb setup)
    var newItem = this.createItem(item);

    newItem.uuid = Neeto.crypto.generateUUID();

    // Update uuids of relationships
    newItem.informReferencesOfUUIDChange(item.uuid, newItem.uuid);

    this.informModelsOfUUIDChangeForItem(newItem, item.uuid, newItem.uuid);

    var block = () => {
      this.addItem(newItem);
      newItem.setDirty(true);
      newItem.markAllReferencesDirty();
      callback();
    }

    if(removeOriginal) {
      // Set to deleted, then run through mapping function so that observers can be notified
      item.deleted = true;
      this.mapResponseItemsToLocalModels([item], ModelManager.MappingSourceLocalSaved);
      block();
    } else {
      block();
    }
  }

  informModelsOfUUIDChangeForItem(newItem, oldUUID, newUUID) {
    // some models that only have one-way relationships might be interested to hear that an item has changed its uuid
    // for example, editors have a one way relationship with notes. When a note changes its UUID, it has no way to inform the editor
    // to update its relationships

    for(var model of this.items) {
      model.potentialItemOfInterestHasChangedItsUUID(newItem, oldUUID, newUUID);
    }
  }

  allItemsMatchingTypes(contentTypes) {
    return this.allItems.filter(function(item){
      return (_.includes(contentTypes, item.content_type) || _.includes(contentTypes, "*")) && !item.dummy;
    })
  }

  itemsForContentType(contentType) {
    return this.allItems.filter(function(item){
      return item.content_type == contentType;
    });
  }

  findItem(itemId) {
    return _.find(this.items, {uuid: itemId});
  }

  findOrCreateTagByTitle(title) {
    var tag = _.find(this.tags, {title: title})
    if(!tag) {
      tag = this.createItem({content_type: "Tag", title: title});
      this.addItem(tag);
    }
    return tag;
  }

  didSyncModelsOffline(items) {
    this.notifySyncObserversOfModels(items, ModelManager.MappingSourceLocalSaved);
  }

  mapResponseItemsToLocalModels(items, source) {
    return this.mapResponseItemsToLocalModelsOmittingFields(items, null, source);
  }

  mapResponseItemsToLocalModelsOmittingFields(items, omitFields, source) {
    var models = [], processedObjects = [], modelsToNotifyObserversOf = [];

    // first loop should add and process items
    for (var json_obj of items) {
      if((!json_obj.content_type || !json_obj.content) && !json_obj.deleted && !json_obj.errorDecrypting) {
        // An item that is not deleted should never have empty content
        console.error("Server response item is corrupt:", json_obj);
        continue;
      }

      json_obj = _.omit(json_obj, omitFields || [])
      var item = this.findItem(json_obj.uuid);

      if(item) {
        item.updateFromJSON(json_obj);
        // If an item goes through mapping, it can no longer be a dummy.
        item.dummy = false;
      }

      if(this.itemsPendingRemoval.includes(json_obj.uuid)) {
        _.pull(this.itemsPendingRemoval, json_obj.uuid);
        continue;
      }

      var unknownContentType = !_.includes(this.acceptableContentTypes, json_obj["content_type"]);
      if(json_obj.deleted == true || unknownContentType) {
        if(item && !unknownContentType) {
          modelsToNotifyObserversOf.push(item);
          this.removeItemLocally(item);
        }
        continue;
      }

      if(!item) {
        item = this.createItem(json_obj, true);
      }

      this.addItem(item);

      modelsToNotifyObserversOf.push(item);
      models.push(item);
      processedObjects.push(json_obj);
    }

    // second loop should process references
    for (var index in processedObjects) {
      var json_obj = processedObjects[index];
      if(json_obj.content) {
        this.resolveReferencesForItem(models[index]);
      }
    }

    this.notifySyncObserversOfModels(modelsToNotifyObserversOf, source);

    return models;
  }

  notifySyncObserversOfModels(models, source) {
    for(var observer of this.itemSyncObservers) {
      var allRelevantItems = models.filter(function(item){return item.content_type == observer.type || observer.type == "*"});
      var validItems = [], deletedItems = [];
      for(var item of allRelevantItems) {
        if(item.deleted) {
          deletedItems.push(item);
        } else {
          validItems.push(item);
        }
      }

      if(allRelevantItems.length > 0) {
        observer.callback(allRelevantItems, validItems, deletedItems, source);
      }
    }
  }

  notifyItemChangeObserversOfModels(models) {
    for(var observer of this.itemChangeObservers) {
      var relevantItems = models.filter(function(item){
        return _.includes(observer.content_types, item.content_type) || _.includes(observer.content_types, "*");
      });

      if(relevantItems.length > 0) {
        observer.callback(relevantItems);
      }
    }
  }

  createItem(json_obj, dontNotifyObservers) {
    var item;
    if(json_obj.content_type == "Note") {
      item = new Note(json_obj);
    } else if(json_obj.content_type == "Tag") {
      item = new Tag(json_obj);
    } else if(json_obj.content_type == "Extension") {
      item = new Extension(json_obj);
    } else if(json_obj.content_type == "SN|Editor") {
      item = new Editor(json_obj);
    } else if(json_obj.content_type == "SN|Theme") {
      item = new Theme(json_obj);
    } else if(json_obj.content_type == "SN|Component") {
      item = new Component(json_obj);
    } else if(json_obj.content_type == "SF|Extension") {
      item = new SyncAdapter(json_obj);
    } else if(json_obj.content_type == "SF|MFA") {
      item = new Mfa(json_obj);
    }

    else {
      item = new Item(json_obj);
    }

    // Some observers would be interested to know when an an item is locally created
    // If we don't send this out, these observers would have to wait until MappingSourceRemoteSaved
    // to hear about it, but sometimes, RemoveSaved is explicitly ignored by the observer to avoid
    // recursive callbacks. See componentManager's syncObserver callback.
    // dontNotifyObservers is currently only set true by modelManagers mapResponseItemsToLocalModels
    if(!dontNotifyObservers) {
      this.notifySyncObserversOfModels([item], ModelManager.MappingSourceLocalSaved);
    }

    item.addObserver(this, function(changedItem){
      this.notifyItemChangeObserversOfModels([changedItem]);
    }.bind(this));

    return item;
  }

  createDuplicateItem(itemResponse, sourceItem) {
    var dup = this.createItem(itemResponse, true);
    this.resolveReferencesForItem(dup);
    return dup;
  }

  addItems(items) {
    items.forEach(function(item){
      if(item.content_type == "Tag") {
        if(!_.find(this.tags, {uuid: item.uuid})) {
          this.tags.splice(_.sortedIndexBy(this.tags, item, function(item){
            if (item.title) return item.title.toLowerCase();
            else return ''
          }), 0, item);
        }
      } else if(item.content_type == "Note") {
        if(!_.find(this.notes, {uuid: item.uuid})) {
          this.notes.unshift(item);
        }
      } else if(item.content_type == "Extension") {
        if(!_.find(this._extensions, {uuid: item.uuid})) {
          this._extensions.unshift(item);
        }
      }

      if(!_.find(this.items, {uuid: item.uuid})) {
        this.items.push(item);
      }
    }.bind(this));
  }

  resortTag(tag) {
    _.pull(this.tags, tag);
    this.tags.splice(_.sortedIndexBy(this.tags, tag, function(tag){
      if (tag.title) return tag.title.toLowerCase();
      else return ''
    }), 0, tag);
  }

  addItem(item) {
    this.addItems([item]);
  }

  resolveReferencesForItem(item) {

    var contentObject = item.contentObject;

    // If another client removes an item's references, this client won't pick up the removal unless
    // we remove everything not present in the current list of references
    item.removeReferencesNotPresentIn(contentObject.references || []);

    if(!contentObject.references) {
      return;
    }

    for(var reference of contentObject.references) {
      var referencedItem = this.findItem(reference.uuid);
      if(referencedItem) {
        item.addItemAsRelationship(referencedItem);
        referencedItem.addItemAsRelationship(item);
      } else {
        // console.log("Unable to find reference:", reference.uuid, "for item:", item);
      }
    }
  }

  addItemSyncObserver(id, type, callback) {
    this.itemSyncObservers.push({id: id, type: type, callback: callback});
  }

  removeItemSyncObserver(id) {
    _.remove(this.itemSyncObservers, _.find(this.itemSyncObservers, {id: id}));
  }

  addItemChangeObserver(id, content_types, callback) {
    this.itemChangeObservers.push({id: id, content_types: content_types, callback: callback});
  }

  removeItemChangeObserver(id) {
    _.remove(this.itemChangeObservers, _.find(this.itemChangeObservers, {id: id}));
  }

  get filteredNotes() {
    return Note.filterDummyNotes(this.notes);
  }

  getDirtyItems() {
    // Items that have errorDecrypting should never be synced back up to the server
    return this.items.filter(function(item){return item.dirty == true && !item.dummy && !item.errorDecrypting})
  }

  clearDirtyItems(items) {
    for(var item of items) {
      item.setDirty(false);
    }
  }

  clearAllDirtyItems() {
    this.clearDirtyItems(this.getDirtyItems());
  }

  setItemToBeDeleted(item) {
    item.deleted = true;
    if(!item.dummy) {
      item.setDirty(true);
    }
    item.removeAndDirtyAllRelationships();
  }

  /* Used when changing encryption key */
  setAllItemsDirty() {
    var relevantItems = this.allItems.filter(function(item){
      return _.includes(this.acceptableContentTypes, item.content_type);
    }.bind(this));

    for(var item of relevantItems) {
      item.setDirty(true);
    }
  }

  removeItemLocally(item, callback) {
    _.pull(this.items, item);

    item.isBeingRemovedLocally();

    this.itemsPendingRemoval.push(item.uuid);

    if(item.content_type == "Tag") {
      _.pull(this.tags, item);
    } else if(item.content_type == "Note") {
      _.pull(this.notes, item);
    } else if(item.content_type == "Extension") {
      _.pull(this._extensions, item);
    }

    this.storageManager.deleteModel(item, callback);
  }

  /*
  Relationships
  */

  createRelationshipBetweenItems(itemOne, itemTwo) {
    itemOne.addItemAsRelationship(itemTwo);
    itemTwo.addItemAsRelationship(itemOne);

    itemOne.setDirty(true);
    itemTwo.setDirty(true);
  }


  /*
  Archives
  */

  getAllItemsJSONData(keys, authParams, protocolVersion, returnNullIfEmpty) {
    var items = _.map(this.allItems, (item) => {
      var itemParams = new ItemParams(item, keys, protocolVersion);
      return itemParams.paramsForExportFile();
    });

    if(returnNullIfEmpty && items.length == 0) {
      return null;
    }

    var data = {items: items}

    if(keys) {
      // auth params are only needed when encrypted with a standard file key
      data["auth_params"] = authParams;
    }

    return JSON.stringify(data, null, 2 /* pretty print */);
  }


  /*
  Misc
  */

  humanReadableDisplayForContentType(contentType) {
    return {
      "Note" : "note",
      "Tag" : "tag",
      "Extension" : "action-based extension",
      "SN|Component" : "component",
      "SN|Editor" : "editor",
      "SN|Theme" : "theme",
      "SF|Extension" : "server extension",
      "SF|MFA" : "server multi-factor authentication setting"
    }[contentType];
  }

}

angular.module('app.frontend').service('modelManager', ModelManager);

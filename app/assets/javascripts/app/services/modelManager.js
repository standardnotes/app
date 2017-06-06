class ModelManager {

  constructor(dbManager) {
    this.dbManager = dbManager;
    this.notes = [];
    this.tags = [];
    this.itemSyncObservers = [];
    this.itemChangeObservers = [];
    this.items = [];
    this._extensions = [];
    this.acceptableContentTypes = ["Note", "Tag", "Extension", "SN|Editor", "SN|Theme", "SN|Component"];
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

  alternateUUIDForItem(item, callback) {
    // we need to clone this item and give it a new uuid, then delete item with old uuid from db (you can't mofidy uuid's in our indexeddb setup)
    var newItem = this.createItem(item);
    newItem.uuid = Neeto.crypto.generateUUID();
    newItem.informReferencesOfUUIDChange(item.uuid, newItem.uuid);
    this.informModelsOfUUIDChangeForItem(newItem, item.uuid, newItem.uuid);
    this.removeItemLocally(item, function(){
      this.addItem(newItem);
      newItem.setDirty(true);
      newItem.markAllReferencesDirty();
      callback();
    }.bind(this));
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
    return this.items.filter(function(item){
      return (_.includes(contentTypes, item.content_type) || _.includes(contentTypes, "*")) && !item.dummy;
    })
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

  mapResponseItemsToLocalModels(items) {
    return this.mapResponseItemsToLocalModelsOmittingFields(items, null);
  }

  mapResponseItemsToLocalModelsOmittingFields(items, omitFields) {
    var models = [], processedObjects = [];

    // first loop should add and process items
    for (var json_obj of items) {
      json_obj = _.omit(json_obj, omitFields || [])
      var item = this.findItem(json_obj["uuid"]);
      if(json_obj["deleted"] == true || !_.includes(this.acceptableContentTypes, json_obj["content_type"])) {
        if(item) {
          this.removeItemLocally(item)
        }
        continue;
      }

      _.omit(json_obj, omitFields);

      if(!item) {
        item = this.createItem(json_obj);
      } else {
        item.updateFromJSON(json_obj);
      }

      this.addItem(item);

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

    this.notifySyncObserversOfModels(models);

    return models;
  }

  notifySyncObserversOfModels(models) {
    for(var observer of this.itemSyncObservers) {
      var relevantItems = models.filter(function(item){return item.content_type == observer.type});
      if(relevantItems.length > 0) {
        observer.callback(relevantItems);
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

  createItem(json_obj) {
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
    }

    else {
      item = new Item(json_obj);
    }

    item.addObserver(this, function(changedItem){
      this.notifyItemChangeObserversOfModels([changedItem]);
    }.bind(this));

    return item;
  }

  addItems(items) {
    this.items = _.uniq(this.items.concat(items));

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
    }.bind(this));
  }

  addItem(item) {
    this.addItems([item]);
  }

  itemsForContentType(contentType) {
    return this.items.filter(function(item){
      return item.content_type == contentType;
    });
  }

  resolveReferencesForItem(item) {
    item.locallyClearAllReferences();
    var contentObject = item.contentObject;
    if(!contentObject.references) {
      return;
    }


    for(var reference of contentObject.references) {
      var referencedItem = this.findItem(reference.uuid);
      if(referencedItem) {
        item.addItemAsRelationship(referencedItem);
        referencedItem.addItemAsRelationship(item);
      } else {
        // console.log("Unable to find item:", reference.uuid);
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
    return this.items.filter(function(item){return item.dirty == true && !item.dummy})
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
    item.removeAllRelationships();
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

    if(item.content_type == "Tag") {
      _.pull(this.tags, item);
    } else if(item.content_type == "Note") {
      _.pull(this.notes, item);
    } else if(item.content_type == "Extension") {
      _.pull(this._extensions, item);
    }

    this.dbManager.deleteItem(item, callback);
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

  removeRelationshipBetweenItems(itemOne, itemTwo) {
    itemOne.removeItemAsRelationship(itemTwo);
    itemTwo.removeItemAsRelationship(itemOne);

    itemOne.setDirty(true);
    itemTwo.setDirty(true);
  }
}

angular.module('app.frontend').service('modelManager', ModelManager);

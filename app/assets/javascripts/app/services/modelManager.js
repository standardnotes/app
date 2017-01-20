class ModelManager {

  constructor(dbManager) {
    this.dbManager = dbManager;
    this.notes = [];
    this.tags = [];
    this.itemSyncObservers = [];
    this.itemChangeObservers = [];
    this.items = [];
    this._extensions = [];
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

  allItemsMatchingTypes(contentTypes) {
    return this.items.filter(function(item){
      return (_.includes(contentTypes, item.content_type) || _.includes(contentTypes, "*")) && !item.dummy;
    })
  }

  findItem(itemId) {
    return _.find(this.items, {uuid: itemId});
  }

  mapResponseItemsToLocalModels(items) {
    return this.mapResponseItemsToLocalModelsOmittingFields(items, null);
  }

  mapResponseItemsToLocalModelsOmittingFields(items, omitFields) {
    var models = [];
    for (var json_obj of items) {
      json_obj = _.omit(json_obj, omitFields || [])
      var item = this.findItem(json_obj["uuid"]);
      if(json_obj["deleted"] == true) {
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

      if(json_obj.content) {
        this.resolveReferencesForItem(item);
      }

      models.push(item);
    }

    this.notifySyncObserversOfModels(models);

    this.sortItems();
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
    } else {
      item = new Item(json_obj);
    }

    item.addObserver(this, function(changedItem){
      this.notifyItemChangeObserversOfModels([changedItem]);
    }.bind(this));

    return item;
  }

  addItems(items) {
    _.each(items, function(item){
      if (!(item.title)) item.title = '';
    });

    this.items = _.uniq(this.items.concat(items));

    items.forEach(function(item){
      if(item.content_type == "Tag") {
        if(!_.find(this.tags, {uuid: item.uuid})) {
          this.tags.splice(_.sortedIndexBy(this.tags, item, function(item){
            return item.title.toLowerCase();
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

  sortItems() {
    Item.sortItemsByDate(this.notes);

    this.tags.forEach(function(tag){
      Item.sortItemsByDate(tag.notes);
    })
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

  removeItemLocally(item) {
    _.pull(this.items, item);

    if(item.content_type == "Tag") {
      _.pull(this.tags, item);
    } else if(item.content_type == "Note") {
      _.pull(this.notes, item);
    } else if(item.content_type == "Extension") {
      _.pull(this._extensions, item);
    }

    this.dbManager.deleteItem(item);
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

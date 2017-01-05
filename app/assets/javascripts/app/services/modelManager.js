class ModelManager {

  constructor() {
    this.notes = [];
    this.tags = [];
    this.itemSyncObservers = [];
    this.items = [];
    this.extensions = [];
  }

  findItem(itemId) {
    return _.find(this.items, {uuid: itemId});
  }

  mapResponseItemsToLocalModels(items) {
    return this.mapResponseItemsToLocalModelsOmittingFields(items, null);
  }

  mapResponseItemsToLocalModelsOmittingFields(items, omitFields) {
    var models = []
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
        this.resolveReferencesForItem(item)
      }

      models.push(item)
    }

    for(var observer of this.itemSyncObservers) {
      var relevantItems = models.filter(function(item){return item.content_type == observer.type});
      if(relevantItems.length > 0) {
        observer.callback(relevantItems);
      }
    }

    this.sortItems();
    return models;
  }

  createItem(json_obj) {
    if(json_obj.content_type == "Note") {
      return new Note(json_obj);
    } else if(json_obj.content_type == "Tag") {
      return new Tag(json_obj);
    } else if(json_obj.content_type == "Extension") {
      return new Extension(json_obj);
    } else {
      return new Item(json_obj);
    }
  }

  addItems(items) {
    this.items = _.uniq(this.items.concat(items));

    items.forEach(function(item){
      if(item.content_type == "Tag") {
        if(!_.find(this.tags, {uuid: item.uuid})) {
          this.tags.unshift(item);
        }
      } else if(item.content_type == "Note") {
        if(!_.find(this.notes, {uuid: item.uuid})) {
          this.notes.unshift(item);
        }
      } else if(item.content_type == "Extension") {
        if(!_.find(this.extensions, {uuid: item.uuid})) {
          this.extensions.unshift(item);
        }
      }
    }.bind(this))
  }

  addItem(item) {
    this.addItems([item])
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
        console.log("Unable to find item:", reference.uuid);
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

  get filteredNotes() {
    return Note.filterDummyNotes(this.notes);
  }

  getDirtyItems() {
    return this.items.filter(function(item){return item.dirty == true && !item.dummy})
  }

  clearDirtyItems() {
    this.getDirtyItems().forEach(function(item){
      item.dirty = false;
    })
  }

  setItemToBeDeleted(item) {
    item.deleted = true;
    item.dirty = true;
    item.removeAllRelationships();
  }

  removeItemLocally(item) {
    _.pull(this.items, item);

    if(item.content_type == "Tag") {
      _.pull(this.tags, item);
    } else if(item.content_type == "Note") {
      _.pull(this.notes, item);
    } else if(item.content_type == "Extension") {
      _.pull(this.extensions, item);
    }
  }

  /*
  Relationships
  */

  createRelationshipBetweenItems(itemOne, itemTwo) {
    itemOne.addItemAsRelationship(itemTwo);
    itemTwo.addItemAsRelationship(itemOne);

    itemOne.dirty = true;
    itemTwo.dirty = true;
  }

  removeRelationshipBetweenItems(itemOne, itemTwo) {
    itemOne.removeItemAsRelationship(itemTwo);
    itemTwo.removeItemAsRelationship(itemOne);

    itemOne.dirty = true;
    itemTwo.dirty = true;
  }
}

angular.module('app.frontend').service('modelManager', ModelManager);

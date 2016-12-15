class ItemManager {

  set items(items) {
    this._items = items;
    this.resolveReferences();
  }

  get items() {
    return this._items;
  }

  referencesForItemId(itemId) {
    return _.find(this.items, {uuid: itemId});
  }

  resolveReferences() {
    this.items.forEach(function(item){
      // build out references
      item.content.references = _.map(item.content.references, function(reference){
        return this.referencesForItemId(reference.uuid);
      }.bind(this))
    }.bind(this));
  }

  itemsForContentType(contentType) {
    return this.items.filter(function(item){
      return item.content_type == contentType;
    });
  }

  // returns dirty item references that need saving
  deleteItem(item) {
    _.remove(this.items, item);
    item.content.references.forEach(function(referencedItem){
      this.removeReferencesBetweenItems(referencedItem, item);
    }.bind(this))

    return item.content.references;
  }

  removeReferencesBetweenItems(itemOne, itemTwo) {
    itemOne.removeReference(itemTwo);
    itemTwo.removeReference(itemOne);
    return [itemOne, itemTwo];
  }

  createReferencesBetweenItems(itemOne, itemTwo) {
    itemOne.addReference(itemTwo);
    itemTwo.addReference(itemOne);
    return [itemOne, itemTwo];
  }
}

angular.module('app.frontend').service('itemManager', ItemManager);

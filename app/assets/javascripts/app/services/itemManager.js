class ItemManager {

  constructor() {
    this._items = [];
  }

  get items() {
    return this._items;
  }

  findItem(itemId) {
    return _.find(this.items, {uuid: itemId});
  }

  addItems(items) {
    this._items = _.uniq(this.items.concat(items));
  }

  resolveReferences() {
    this.items.forEach(function(item){
      // build out references, safely handle broken references
      item.content.references = _.reduce(item.content.references, function(accumulator, reference){
        var item = this.findItem(reference.uuid);
        if(item) {
          accumulator.push(item);
        }
        return accumulator;
      }.bind(this), []);
    }.bind(this));
  }

  itemsForContentType(contentType) {
    return this.items.filter(function(item){
      return item.content_type == contentType;
    });
  }

  addItem(item) {
    this.items.push(item);
  }

  // returns dirty item references that need saving
  deleteItem(item) {
    var dirty = [];
    _.remove(this.items, item);
    var length = item.content.references.length;
    // note that references are deleted in this for loop, so you have to be careful how you iterate
    for(var i = 0; i < length; i++) {
      var referencedItem = item.content.references[0];
      // console.log("removing references between items", referencedItem, item);
      var _dirty = this.removeReferencesBetweenItems(referencedItem, item);
      dirty = dirty.concat(_dirty);
    }

    return dirty;
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

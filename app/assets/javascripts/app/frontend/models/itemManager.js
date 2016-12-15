class ItemManager() {

  set items(items) {
    this.items = items;
    resolveReferences();
  }

  referencesForItemId(itemId) {
    return _.find(this.items, {uuid: itemId});
  }

  resolveReferences() {
    this.items.forEach(function(item){
      // build out references
      _.map(item.references, function(reference){
        return referencesForItemId(reference.uuid);
      })
    });
  }

  itemsForContentType(contentType) {
    this.items.filter(function(item){
      return item.content_type == contentType;
    });
  }

  // returns dirty item references that need saving
  deleteItem(item) {
    _.remove(this.items, item);
    item.references.forEach(function(reference){
      removeReferencesFromItem(reference, item);
    })

    return item.references;
  }

  removeReferencesBetweenItems(itemOne, itemTwo) {
    _.remove(itemOne.references, _.find(itemOne.references, {uuid: itemTwo.uuid}));
    _.remove(itemTwo.references, _.find(itemTwo.references, {uuid: itemOne.uuid}));
    return [itemOne, itemTwo];
  }

  removeReferencesBetweenItems(itemOne, itemTwo) {
    itemOne.references.push(itemTwo);
    itemTwo.references.push(itemOne);
    return [itemOne, itemTwo];
  }

  createReferencesBetweenItems(itemOne, itemTwo) {
    itemOne.references.push(itemTwo);
    itemTwo.references.push(itemOne);
    return [itemOne, itemTwo];
  }

}

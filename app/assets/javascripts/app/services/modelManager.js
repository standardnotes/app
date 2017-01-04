class ModelManager extends ItemManager {

  constructor() {
    super();
    this.notes = [];
    this.tags = [];
    this.dirtyItems = [];
    this.changeObservers = [];
  }

  resolveReferences() {
    super.resolveReferences()

    this.notes.push.apply(this.notes, _.difference(this.itemsForContentType("Note"), this.notes));
    Item.sortItemsByDate(this.notes);
    this.notes.forEach(function(note){
      note.updateReferencesLocalMapping();
    })

    this.tags.push.apply(this.tags, _.difference(this.itemsForContentType("Tag"), this.tags));
    this.tags.forEach(function(tag){
      tag.updateReferencesLocalMapping();
    })
  }

  watchItemType(type, callback) {
    console.log("Watching item type", type, "callback:", callback);
    this.changeObservers.push({type: type, callback: callback});
    console.log("Change observers", this.changeObservers);
  }

  addDirtyItems(items) {
    if(!(items instanceof Array)) {
      items = [items];
    }

    this.dirtyItems = this.dirtyItems.concat(items);
    this.dirtyItems = _.uniq(this.dirtyItems);
  }

  get filteredNotes() {
    return Note.filterDummyNotes(this.notes);
  }

  clearDirtyItems() {
    console.log("Clearing dirty items", this.dirtyItems);
    for(var observer of this.changeObservers) {
      var changedItems = this.dirtyItems.filter(function(item){return item.content_type == observer.type});
      console.log("observer:", observer, "items", changedItems);
      observer.callback(changedItems);
    }
    this.dirtyItems = [];
  }

  addNote(note) {
    if(!_.find(this.notes, {uuid: note.uuid})) {
      this.notes.unshift(note);
      this.addItem(note);
    }
  }

  addTag(tag) {
    this.tags.unshift(tag);
    this.addItem(tag);
  }

  addTagToNote(tag, note) {
    var dirty = this.createReferencesBetweenItems(tag, note);
    this.refreshRelationshipsForTag(tag);
    this.refreshRelationshipsForNote(note);
    this.addDirtyItems(dirty);
  }

  refreshRelationshipsForTag(tag) {
    tag.notes = tag.referencesMatchingContentType("Note");
    Item.sortItemsByDate(tag.notes);
  }

  refreshRelationshipsForNote(note) {
    note.tags = note.referencesMatchingContentType("Tag");
  }

  removeTagFromNote(tag, note) {
    var dirty = this.removeReferencesBetweenItems(tag, note);
    this.addDirtyItems(dirty);
  }

  deleteItem(item) {
    var dirty = super.deleteItem(item);
    if(item.content_type == "Note") {
        _.remove(this.notes, item);
    } else if(item.content_type == "Tag") {
        _.remove(this.tags, item);
    }
    return dirty;
  }

  deleteNote(note) {
    var dirty = this.deleteItem(note);
    _.remove(this.notes, note);
    if(!note.dummy) {
      this.addDirtyItems(dirty);
    }
  }

  deleteTag(tag) {
    var dirty = this.deleteItem(tag);
    _.remove(this.tags, tag);
    this.addDirtyItems(dirty);
  }

}

angular.module('app.frontend').service('modelManager', ModelManager);

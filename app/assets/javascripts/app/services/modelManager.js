class ModelManager extends ItemManager {

  constructor() {
    super();
    this.notes = [];
    this.tags = [];
    this.dirtyItems = [];
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

  deleteNote(note) {
    var dirty = this.deleteItem(note);
    _.remove(this.notes, note);
    this.addDirtyItems(dirty);
  }

  deleteTag(tag) {
    var dirty = this.deleteItem(tag);
    _.remove(this.tags, tag);
    this.addDirtyItems(dirty);
  }

}

angular.module('app.frontend').service('modelManager', ModelManager);

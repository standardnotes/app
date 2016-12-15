class ModelManager extends ItemManager {

  constructor() {
    super();
    this.notes = [];
    this.groups = [];
    this.dirtyItems = [];
  }

  set items(items) {
    super.items = items;
    this.notes = _.map(this.itemsForContentType("Note"), function(json_obj) {
      return new Note(json_obj);
    })

    this.tags = _.map(this.itemsForContentType("Tag"), function(json_obj) {
      var tag = new Tag(json_obj);
      console.log("tag references upon import", tag.content.references);
      tag.updateReferencesLocalMapping();
      return tag;
    })
  }

  get items() {
    return super.items;
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
    }
  }

  addTag(tag) {
    this.tags.unshift(tag);
  }

  addTagToNote(tag, note) {
    console.log("adding tag to note", tag, note);
    var dirty = this.createReferencesBetweenItems(tag, note);
    this.refreshRelationshipsForTag(tag);
    this.refreshRelationshipsForNote(note);
    this.addDirtyItems(dirty);
  }

  refreshRelationshipsForTag(tag) {
    tag.notes = tag.referencesMatchingContentType("Note");
    tag.notes.sort(function(a,b){
      return new Date(b.created_at) - new Date(a.created_at);
    });
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
    this.addDirtyItems(dirty);
  }

  deleteTag(tag) {
    var dirty = this.deleteItem(tag);
    this.addDirtyItems(dirty);
  }

  filteredNotes() {
    return Note.filterDummyNotes(this.notes);
  }
}

angular.module('app.frontend').service('modelManager', ModelManager);

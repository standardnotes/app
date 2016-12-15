class ModelManager extends ItemManager {

  set items(items) {
    super.items = items;

    this.notes = _.map(this.items.itemsForContentType("Note"), function(json_obj) {
      return new Note(json_obj);
    })

    this.groups = _.map(this.items.itemsForContentType("Group"), function(json_obj) {
      var group = Group(json_obj);
      group.updateReferencesLocalMapping();
      return group;
    })
  }

  addDirtyItems(items) {
    if(this.dirtyItems) {
      this.dirtyItems = [];
    }

    this.dirtyItems.concat(items);
  }

  get dirtyItems() {
    return this.dirtyItems || [];
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
    note.groups = note.referencesMatchingContentType("Group");
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

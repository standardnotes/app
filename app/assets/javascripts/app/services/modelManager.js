class ModelManager extends ItemManager {

  constructor() {
    super();
    this.notes = [];
    this.groups = [];
    this.dirtyItems = [];
  }

  // get items() {
  //   return super.items()
  // }

  mapResponseItemsToLocalModels(items) {
    var models = []
    for (var json_obj of items) {
      var item = this.findItem(json_obj["uuid"]);
      if(json_obj["deleted"] == true) {
          if(item) {
            this.deleteItem(item)
          }
          continue;
      }

      if(item) {
        _.merge(item, json_obj);
      } else {
        item = this.createItem(json_obj);
      }

      models.push(item)
    }
    this.addItems(models)
    return models;
  }

  createItem(json_obj) {
    if(json_obj.content_type == "Note") {
      return new Note(json_obj);
    } else if(json_obj.content_type == "Tag") {
      return new Tag(json_obj);
    } else {
      return new Item(json_obj);
    }
  }

   addItems(items) {
    super.addItems(items)
    this.notes = this.itemsForContentType("Note");
    this.notes.forEach(function(note){
      note.updateReferencesLocalMapping();
    })

    this.tags = this.itemsForContentType("Tag");
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

  filteredNotes() {
    return Note.filterDummyNotes(this.notes);
  }
}

angular.module('app.frontend').service('modelManager', ModelManager);

class User {
  constructor(json_obj) {
    _.merge(this, json_obj);

    this.itemManager = new ItemManager();
    this.itemManager.items = this.items;
    this.items = null;

    this.notes = _.map(this.itemManager.itemsForContentType("Note"), function(json_obj) {
      return new Note(json_obj);
    })

    this.groups = _.map(this.itemManager.itemsForContentType("Group"), function(json_obj) {
      var group = Group(json_obj);
      group.updateReferencesLocalMapping();
      return group;
    })
  }

  filteredNotes() {
    return Note.filterDummyNotes(this.notes);
  }
}

class Note extends Item {

  constructor(json_obj) {
    super(json_obj);

    if(!this.tags) {
      this.tags = [];
    }

    if(!this.content.title) {
      this.content.title = "";
    }

    if(!this.content.text) {
      this.content.text = "";
    }
  }

  static filterDummyNotes(notes) {
    var filtered = notes.filter(function(note){return note.dummy == false || note.dummy == null});
    return filtered;
  }

  updateReferencesLocalMapping() {
    super.updateReferencesLocalMapping();
    this.tags = this.referencesMatchingContentType("Tag");
  }

  referencesAffectedBySharingChange() {
    return super.referencesAffectedBySharingChange();
  }

  get hasOnePublicTag() {
    for (var tag of this.tags) {
      if(tag.isPublic()) {
        return true
      }
    }
    return false;
  }

  toJSON() {
    return {uuid: this.uuid}
  }

  isSharedIndividually() {
    return this.presentation_name;
  }

  isPublic() {
    return super.isPublic() || this.hasOnePublicTag;
  }

  get content_type() {
    return "Note";
  }
}

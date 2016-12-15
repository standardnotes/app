class Note extends Item {

  constructor(json_obj) {
    super(json_obj);

    if(!this.tags) {
      this.tags = [];
    }

    if(!this.content.title) {
      this.content.title = "";
      this.content.text = "";
    }
  }

  static filterDummyNotes(notes) {
    var filtered = notes.filter(function(note){return note.dummy == false || note.dummy == null});
    return filtered;
  }

  get hasOnePublicTag() {
    var hasPublicTag = false;
    this.tags.forEach(function(tag){
      if(tag.isPublic()) {
        hasPublicTag = true;
        return;
      }
    })

    return hasPublicTag;
  }

  isPublic() {
    return super.isPublic() || this.hasOnePublicTag;
  }

  get content_type() {
    return "Note";
  }
}

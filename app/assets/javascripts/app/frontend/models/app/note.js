class Note extends Item {

  constructor(json_obj) {

    super(json_obj);

    if(!this.content) {
      this.content = {title: "", text: ""};
    }
  }

  filterDummyNotes(notes) {
    var filtered = notes.filter(function(note){return note.dummy == false || note.dummy == null});
    return filtered;
  }

  get hasOnePublicGroup() {
    var hasPublicGroup = false;
    this.groups.forEach(function(group){
      if(group.isPublic()) {
        hasPublicGroup = true;
        return;
      }
    })

    return hasPublicGroup;
  }

  isPublic() {
    return super.isPublic() || this.hasOnePublicGroup;
  }

  get content_type() {
    return "Note";
  }
}

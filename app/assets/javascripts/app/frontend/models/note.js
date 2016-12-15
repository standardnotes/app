class Note extends Item {
  constructor(json_obj) {
    var content;

    Object.defineProperty(this, "content", {
      get: function() {
        return content;
      },
      set: function(value) {
        var finalValue = value;

        if(typeof value === 'string') {
          try {
            decodedValue = JSON.parse(value);
            finalValue = decodedValue;
          }
          catch(e) {
            finalValue = value;
          }
        }

        content = finalValue;
      },
      enumerable: true,
    });

    this.setContentRaw = function(rawContent) {
      content = rawContent;
    }

    _.merge(this, json_obj);

    if(!this.content) {
      this.content = {title: "", text: ""};
    }
  }

  filterDummyNotes(notes) {
    var filtered = notes.filter(function(note){return note.dummy == false || note.dummy == null});
    return filtered;
  }

  updateReferencesLocalMapping() {
    super.updateReferencesLocalMapping();
    this.groups = this.referencesMatchingContentType("Group");
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

  function isPublic() {
    return super.isPublic() || this.hasOnePublicGroup;
  }
}

var Note = function (json_obj) {
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
};

Note.filterDummyNotes = function(notes) {
  var filtered = notes.filter(function(note){return note.dummy == false || note.dummy == null});
  return filtered;
}

/* Returns true if note is shared individually or via group */
Note.prototype.isPublic = function() {
  return this.presentation || (this.group && this.group.presentation);
};

Note.prototype.isEncrypted = function() {
  return this.encryptionEnabled() && typeof this.content === 'string' ? true : false;
}

Note.prototype.encryptionEnabled = function() {
  return this.loc_eek;
}

Note.prototype.presentationURL = function() {
  return this.presentation.url;
}

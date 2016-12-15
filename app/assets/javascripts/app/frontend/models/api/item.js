class Item {

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

    _.merge(this, json_obj);

    this.setContentRaw = function(rawContent) {
      content = rawContent;
    }
  }

  referencesMatchingContentType(contentType) {
    return this.references.filter(function(reference){
      return reference.content_type == content_type;
    });
  }

  updateReferencesLocalMapping() {
    // should be overriden to manage local properties
  }

  /* Returns true if note is shared individually or via group */
  isPublic() {
    return this.presentation;
  }

  isEncrypted() {
    return this.encryptionEnabled() && typeof this.content === 'string' ? true : false;
  }

  encryptionEnabled() {
    return this.loc_eek;
  }

  presentationURL() {
    return this.presentation.url;
  }
}

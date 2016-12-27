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
            var decodedValue = JSON.parse(value);
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

    if(this.created_at) {
      this.created_at = new Date(this.created_at);
      this.updated_at = new Date(this.updated_at);
    } else {
      this.created_at = new Date();
      this.updated_at = new Date();
    }

    if(!this.uuid) {
      this.uuid = Neeto.crypto.generateUUID();
    }

    this.setContentRaw = function(rawContent) {
      content = rawContent;
    }

    if(!this.content) {
      this.content = {};
    }

    if(!this.content.references) {
      this.content.references = [];
    }
  }

  static sortItemsByDate(items) {
    items.sort(function(a,b){
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }

  addReference(reference) {
    this.content.references.push(reference);
    this.content.references = _.uniq(this.content.references);
    this.updateReferencesLocalMapping();
  }

  removeReference(reference) {
    _.remove(this.content.references, _.find(this.content.references, {uuid: reference.uuid}));
    this.updateReferencesLocalMapping();
  }

  referencesMatchingContentType(contentType) {
    return this.content.references.filter(function(reference){
      return reference.content_type == contentType;
    });
  }

  mergeMetadataFromItem(item) {
    _.merge(this, _.omit(item, ["content"]));
  }

  updateReferencesLocalMapping() {
    // should be overriden to manage local properties
  }

  referencesAffectedBySharingChange() {
    // should be overriden to determine which references should be decrypted/encrypted
    return null;
  }

  isPublic() {
    return this.presentation_name;
  }

  isEncrypted() {
    return this.encryptionEnabled() && typeof this.content === 'string' ? true : false;
  }

  encryptionEnabled() {
    return this.enc_item_key;
  }

  presentationURL() {
    return this.presentation_url;
  }

}

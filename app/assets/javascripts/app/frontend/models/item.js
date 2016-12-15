class Item {

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

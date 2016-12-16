class Tag extends Item {

  constructor(json_obj) {
    super(json_obj);

    if(!this.notes) {
      this.notes = [];
    }

    if(!this.content.title) {
      this.content.title = "";
    }
  }

  get content_type() {
    return "Tag";
  }

  updateReferencesLocalMapping() {
    super.updateReferencesLocalMapping();
    this.notes = this.referencesMatchingContentType("Note");
  }

  referencesAffectedBySharingChange() {
    return this.referencesMatchingContentType("Note");
  }
}

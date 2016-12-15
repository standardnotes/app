class Group extends Item {
  constructor(json_obj) {
    _.merge(this, json_obj);
  }

  updateReferencesLocalMapping() {
    super.updateReferencesLocalMapping();
    this.notes = this.referencesMatchingContentType("Note");
    this.notes.sort(function(a,b){
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }
}

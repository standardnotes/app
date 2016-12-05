var Note = function (json_obj) {
  _.merge(this, json_obj);
};

/* Returns true if note is shared individually or via group */
Note.prototype.isPublic = function() {
  return this.hasEnabledPresentation() || this.shared_via_group;
};

Note.prototype.isEncrypted = function() {
  return this.local_eek ? true : false;
}

Note.prototype.hasEnabledPresentation = function() {
  return this.presentation && this.presentation.enabled;
}

Note.prototype.presentationURL = function() {
  return this.presentation.url;
}

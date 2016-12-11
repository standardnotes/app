var Note = function (json_obj) {
  _.merge(this, json_obj);
};

Note.prototype = {
  set content(content) {
    try {
       var data = JSON.parse(content);
       this.title = data.title || data.name;
       this.text = data.text || data.content;
    }
    catch(e) {
      this.text = content;
    }
  }
}

Note.prototype.JSONContent = function() {
  return JSON.stringify({title: this.title, text: this.text});
};

/* Returns true if note is shared individually or via group */
Note.prototype.isPublic = function() {
  return this.hasEnabledPresentation() || this.shared_via_group;
};

Note.prototype.isEncrypted = function() {
  return this.loc_eek || this.local_eek ? true : false;
}

Note.prototype.hasEnabledPresentation = function() {
  return this.presentation && this.presentation.enabled;
}

Note.prototype.presentationURL = function() {
  return this.presentation.url;
}

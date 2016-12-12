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

  _.merge(this, json_obj);

  if(!this.content) {
    this.content = {title: "", text: ""};
  }
};

/* Returns true if note is shared individually or via group */
Note.prototype.isPublic = function() {
  return this.hasEnabledPresentation() || this.shared_via_group;
};

Note.prototype.isEncrypted = function() {
  return (this.loc_eek || this.local_eek) && typeof this.content === 'string' ? true : false;
}

Note.prototype.hasEnabledPresentation = function() {
  return this.presentation && this.presentation.enabled;
}

Note.prototype.presentationURL = function() {
  return this.presentation.url;
}

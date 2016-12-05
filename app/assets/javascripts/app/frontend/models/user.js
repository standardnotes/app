var User = function (json_obj) {
  _.merge(this, json_obj);
};

User.prototype.getUsername = function() {
  if(!this.presentation) {
    return null;
  }
  return this.presentation.root_path;
};

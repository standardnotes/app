var User = function (json_obj) {
  _.merge(this, json_obj);

  this.notes = _.map(this.notes, function(json_obj) {
    return new Note(json_obj);
  });

  this.groups = _.map(this.groups, function(json_obj) {
    return new Group(json_obj);
  });

  this.groups.forEach(function(group){
    var notes = this.notes.filter(function(note){return note.group_id && note.group_id == group.id});
    notes.forEach(function(note){
      note.group = group;
    })
    group.notes = notes;
  }.bind(this))
};

User.prototype.filteredNotes = function() {
  return Note.filterDummyNotes(this.notes);
}

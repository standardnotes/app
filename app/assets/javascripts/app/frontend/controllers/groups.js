angular.module('app.frontend')
  .directive("groupsSection", function(){
    return {
      restrict: 'E',
      scope: {
        addNew: "&",
        selectionMade: "&",
        willSelect: "&",
        save: "&",
        groups: "=",
        allGroup: "=",
        user: "=",
        updateNoteGroup: "&"
      },
      templateUrl: 'frontend/groups.html',
      replace: true,
      controller: 'GroupsCtrl',
      controllerAs: 'ctrl',
      bindToController: true,

      link:function(scope, elem, attrs, ctrl) {
        scope.$watch('ctrl.groups', function(newGroups){
          if(newGroups) {
            ctrl.setGroups(newGroups);
          }
        });
      }
    }
  })
  .controller('GroupsCtrl', function (apiController) {

    var initialLoad = true;

    this.setGroups = function(groups) {
      if(initialLoad) {
          initialLoad = false;
          this.selectGroup(this.allGroup);
      } else {
        if(groups && groups.length > 0) {
          this.selectGroup(groups[0]);
        }
      }
    }

    this.selectGroup = function(group) {
      this.willSelect()(group);
      this.selectedGroup = group;
      this.selectionMade()(group);
    }

    this.clickedAddNewGroup = function() {
      if(this.editingGroup) {
        return;
      }

      this.newGroup = new Group({notes : []});
      if(!this.user.id) {
        this.newGroup.id = Neeto.crypto.generateRandomKey()
      }
      this.selectedGroup = this.newGroup;
      this.editingGroup = this.newGroup;
      this.addNew()(this.newGroup);
    }

    var originalGroupName = "";
    this.onGroupTitleFocus = function(group) {
      originalGroupName = group.name;
    }

    this.groupTitleDidChange = function(group) {
      this.editingGroup = group;
    }

    this.saveGroup = function($event, group) {
      this.editingGroup = null;
      if(group.name.length == 0) {
        group.name = originalGroupName;
        originalGroupName = "";
        return;
      }

      $event.target.blur();
      if(!group.name || group.name.length == 0) {
          return;
      }

      this.save()(group, function(savedGroup){
        _.merge(group, savedGroup);
        this.selectGroup(group);
        this.newGroup = null;
      }.bind(this));
    }

    this.noteCount = function(group) {
      var validNotes = Note.filterDummyNotes(group.notes);
      return validNotes.length;
    }

    this.handleDrop = function(e, newGroup, note) {
      if(this.selectedGroup.all) {
        // coming from all, remove from original group if applicable
        if(note.group_id) {
          var originalGroup = this.groups.filter(function(group){
            return group.id == note.group_id;
          })[0];
          _.remove(originalGroup.notes, note);
        }
      } else {
        _.remove(this.selectedGroup.notes, note);
      }

      this.updateNoteGroup()(note, newGroup, this.selectedGroup);
    }.bind(this)


  });

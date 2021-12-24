class TagTree {

  constructor() {
    this.restrict = "C";
    this.templateUrl = "directives/tag_tree.html";
    this.scope = {
      tag: "=",
      changeParent: "&",
      onSelect: "&",
      createTag: "&",
      saveTags: "&",
      deleteTag: "&",
      onToggleCollapse: "&"
    };
  }

  controller($scope, $timeout) {
    'ngInject';

    $scope.isDraggable = function() {
      return !$scope.tag.master && $scope.tag.content_type != 'SN|SmartTag';
    }

    $scope.isDroppable = function() {
      return !$scope.tag.smartMaster && $scope.tag.content_type != 'SN|SmartTag';
    }

    $scope.onDrop = function(sourceId, targetId) {
      $scope.changeParent()(sourceId, targetId);
    }

    $scope.onDragOver = function(event) {

    }

    $scope.onDragStart = function(event) {

    }

    $scope.selectTag = function(event) {
      let multiSelect = event.ctrlKey || event.metaKey;
      $scope.onSelect()($scope.tag, multiSelect);
    }

    $scope.addChild = function($event, parent) {
      $event.stopPropagation();
      var addingTag = {dummy: true, parent: parent, content: {title: ""}};
      parent.children.unshift(addingTag);
    }

    $scope.saveNewTag = function(tag) {
      if(tag.content.title && tag.content.title.length > 0) {
        $scope.createTag()(tag);
      }
      tag.parent.children.splice(tag.parent.children.indexOf(tag), 1);
    }

    $scope.removeTag = function(tag) {
      $scope.deleteTag()(tag);
    }

    $scope.innerCollapse = function(tag) {
      if($scope.onToggleCollapse()) {
        $scope.onToggleCollapse()(tag);
      }
    }

    $scope.saveTagRename = function(tag) {
      if(!tag.displayTitle || tag.displayTitle.length == 0) {
        // Delete
        $scope.deleteTag()(tag);
        return;
      }
      var delimiter = ".";
      var tags = [tag];
      var title;
      if(tag.parent.master) {
        title = tag.displayTitle;
      } else {
        title = tag.parent.content.title + delimiter + tag.displayTitle;
      }

      tag.content.title = title;

      function renameChildren(tag) {
        for(var child of tag.children) {
          child.content.title = child.parent.content.title + delimiter + child.displayTitle;
          tags.push(child);
          renameChildren(child);
        }
      }

      renameChildren(tag);

      tag.editing = false;

      $scope.saveTags()(tags);
    }

    $scope.generationForTag = function(tag) {
      var generation = 0;
      var parent = tag.parent;
      while(parent) {
        generation++;
        parent = parent.parent;
      }

      return generation;
    }

    $scope.circleClassForTag = function(tag) {
      if(tag.content_type == "SN|SmartTag") {
        return "success";
      }

      // is newly creating tag
      if(!tag.uuid) {
        return "neutral";
      }


      let gen = $scope.generationForTag(tag);
      var circleClass = {
        0: "info",
        1: "info",
        2: "success",
        3: "danger",
        4: "warning",
      }[gen];

      if(!circleClass) {
        circleClass = "neutral";
      }

      // Newly creating tags don't have client data
      if(tag.clientData && tag.clientData.collapsed) {
        circleClass += " no-bg";
      }

      return circleClass;
    }

  }
}

TagTree.$$ngIsClass = true;

angular.module('app').directive('tagTree', () => new TagTree);

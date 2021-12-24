class HomeCtrl {
  constructor($rootScope, $scope, $timeout) {

    let smartTagContentType = "SN|SmartTag";

    let componentRelay = new ComponentRelay({
      targetWindow: window,
      onReady: () => {
        $rootScope.platform = componentRelay.platform;
      }
    });

    let delimiter = ".";

    $scope.resolveRawTags = function(masterTag) {
      let sortTags = (tags) => {
        return tags.sort((a, b) => {
          const aTitle = a.content.title.toLowerCase(), bTitle = b.content.title.toLowerCase();
          return (aTitle > bTitle) - (aTitle < bTitle);
        });
      }
      var resolved = masterTag.rawTags.slice();

      var findResolvedTag = function(title) {
        for(var tag of masterTag.rawTags) {
          if(tag.content.title === title) {
            return tag;
          }
        }
        return null;
      }

      for(var tag of masterTag.rawTags) {
        var pendingDummy = tag.children && tag.children.find((c) => {return c.dummy});
        tag.children = [];
        tag.parent = null;

        if(pendingDummy) {
          tag.children.unshift(pendingDummy);
        }
      };

      for(var tag of masterTag.rawTags) {
        var name = tag.content.title;
        var comps = name.split(delimiter);
        tag.displayTitle = comps[comps.length -1];
        if(comps.length == 1) {
          tag.parent = masterTag;
          continue;
        }

        var getParent = function(depth = 1) {
          var parentTitle = comps.slice(0, comps.length - depth).join(delimiter);
          if(parentTitle.length == 0) {
            return null;
          }
          var parent = findResolvedTag(parentTitle);

          // didn't find parent, try again.
          // just make sure we're not deeper in search than we can go
          if(!parent && depth < comps.length - 1) {
            return getParent(depth + 1);
          }

          // remove parent from name and keep this full tag name to display
          var tagTitle = tag.content.title.slice(parentTitle.length+1);
          tag.displayTitle = tagTitle;

          return parent;
        };

        var parent = getParent();

        // no parent at all up the tree, fall back to root with full name
        if(!parent) {
          tag.displayTitle = tag.content.title;
          tag.parent = masterTag;
          continue;
        }

        parent.children.push(tag);
        parent.children = sortTags(parent.children);
        tag.parent = parent;

        // remove chid from master list
        var index = resolved.indexOf(tag);
        resolved.splice(index, 1);

        if($scope.selectedTag && $scope.selectedTag.uuid == tag.uuid) {
          $scope.selectedTag = tag;
          $scope.setSelectedForTag(tag, true);
        }
      }

      var pendingDummy = masterTag.children && masterTag.children.find((c) => {return c.dummy});
      masterTag.children = sortTags(resolved);
      if(pendingDummy) { masterTag.children.unshift(pendingDummy); }
    }

    $scope.changeParent = function(sourceId, targetId) {
      var source = $scope.masterTag.rawTags.filter(function(tag){
        return tag.uuid === sourceId;
      })[0];

      var target = targetId === "0" ? $scope.masterTag : $scope.masterTag.rawTags.filter(function(tag){
        return tag.uuid === targetId;
      })[0];

      if(target.parent === source) {
        return;
      }

      var needsSave = [source];

      var adjustChildren = function(source) {
        for(var child of source.children) {
          var newTitle = source.content.title + delimiter + child.content.title.split(delimiter).slice(-1)[0];
          child.content.title = newTitle;
          needsSave.push(child);
          adjustChildren(child);
        }
      }

      var newTitle;
      if(target.master) {
        newTitle = source.content.title.split(delimiter).slice(-1)[0];
      } else {
        newTitle = target.content.title + delimiter + source.content.title.split(delimiter).slice(-1)[0];
      }
      source.content.title = newTitle;
      adjustChildren(source);
      $scope.resolveRawTags($scope.masterTag);

      componentRelay.saveItems(needsSave);
    }

    $scope.createTag = function(tag) {
      var title = tag.content.title;
      if(title.startsWith("![")) {
        /*
        Create smart tag. Examples:
        !["Not Pinned", "pinned", "=", false]
        !["Last Day", "updated_at", ">", "1.days.ago"]
        !["Long", "text.length", ">", 500]
        */
        try {
          var components = JSON.parse(title.substring(1, title.length));
        } catch (e) {
          alert("There was an error parsing your smart tag syntax. Please ensure the value after the exclamation mark is valid JSON, and try again.")
          return;
        }
        var smartTag = {
          content_type: smartTagContentType,
          content: {
            title: components[0],
            predicate: {
              keypath: components[1],
              operator: components[2],
              value: components[3]
            }
          }
        }
        componentRelay.createItem(smartTag, (createdTag) => {
          // We don't want to select the tag right away because it hasn't been added yet.
          // If you do $scope.selectTag(createdTag), an issue occurs where selecting another tag
          // after that will not dehighlight this one.
          $scope.selectOnLoad = createdTag;
        });
      } else {
        tag.content_type = "Tag";
        var title;
        if(tag.parent.master) {
          title = tag.content.title;
        } else {
          title = tag.parent.content.title + delimiter + tag.content.title;
        }
        tag.content.title = title;
        tag.dummy = false;
        componentRelay.createItem(tag, (createdTag) => {
          $scope.selectOnLoad = createdTag;
        });
      }
    }

    $scope.selectTag = function(tag, multiSelect) {
      let isSmartTag = tag.content_type == smartTagContentType;
      // Multi selection for smart tags is not possible.
      if(isSmartTag) {
        multiSelect = false;
      }

      let clearMultipleTagsSelection = function() {
        if($scope.multipleTags) {
          for(var selectedTag of $scope.multipleTags) {
            $scope.setSelectedForTag(selectedTag, false);
          }
        }
      }

      if(tag.master || tag.smartMaster) {
        clearMultipleTagsSelection();
        $scope.multipleTags = [];
        componentRelay.clearSelection();
      } else {
        if(!$scope.multipleTags) { $scope.multipleTags = []; }
        if(!isSmartTag) {
          $scope.multipleTags.push(tag);
        }
        if(multiSelect && $scope.multipleTags.length > 1) {
          var smartTag = $scope.createEphemeralSmartTagForMultiTags();
          componentRelay.selectItem(smartTag);
        } else {
          clearMultipleTagsSelection();
          $scope.multipleTags = isSmartTag ? [] : [tag];
          componentRelay.selectItem(tag);
        }
      }

      // if multiselect, we don't want to clear selected tag. But if master is selected,
      // and multi select other tag, we do want to clear master. Rather than creating a large if
      // statement, we'll just an if else.

      if(!multiSelect && $scope.selectedTag && $scope.selectedTag != tag) {
        $scope.setSelectedForTag($scope.selectedTag, false);
        $scope.selectedTag.editing = false;
      } else if($scope.selectedTag.master || $scope.selectedTag.smartMaster || $scope.selectedTag.content_type == smartTagContentType) {
        $scope.setSelectedForTag($scope.selectedTag, false);
      }

      if($scope.selectedTag === tag && !tag.master && !tag.content.isSystemTag) {
        tag.editing = true;
      }

      $scope.selectedTag = tag;
      $scope.setSelectedForTag(tag, true);
    }

    $scope.createEphemeralSmartTagForMultiTags = function() {
      let smartTag = {
        uuid: Math.random(),
        content_type: "SN|SmartTag",
        content: {
          title: "Multiple tags"
        }
      }

      var tagNames = $scope.multipleTags.map((tag) => {return tag.content.title});
      var predicate = ["tags", "includes", ["title", "in", tagNames]];
      smartTag.content.predicate = predicate;
      return smartTag;
    }

    $scope.toggleCollapse = function(tag) {
      tag.clientData.collapsed = !tag.clientData.collapsed;
      if(!tag.master) {
        componentRelay.saveItem(tag);
      }
    }

    $scope.saveTags = function(tags) {
      componentRelay.saveItems(tags);
    }

    $scope.setSelectedForTag = function(tag, selected) {
      tag.selected = selected;
    }

    componentRelay.streamItems(["Tag", smartTagContentType], (newTags) => {
      $timeout(() => {
        var allTags = $scope.masterTag ? $scope.masterTag.rawTags : [];
        var smartTags = $scope.smartMasterTag ? $scope.smartMasterTag.rawTags : SNSmartTag.systemSmartTags();
        for(var tag of newTags) {
          var isSmartTag = tag.content_type == smartTagContentType;
          var arrayToUse = isSmartTag ? smartTags : allTags;

          var existing = arrayToUse.filter((tagCandidate) => {
            return tagCandidate.uuid === tag.uuid;
          })[0];

          if(existing) {
            Object.assign(existing, tag);
          } else if(tag.content.title) {
            arrayToUse.push(tag);
          }

          if(tag.deleted) {
            var index = arrayToUse.indexOf(existing || tag);
            arrayToUse.splice(index, 1);
          } else {
            if($scope.selectOnLoad && $scope.selectOnLoad.uuid == tag.uuid)  {
              $scope.selectOnLoad = null;
              $scope.selectTag(tag);
            } else if(existing && $scope.selectedTag && $scope.selectedTag.uuid == existing.uuid) {
              // Don't call $scope.selectTag(existing) as this will double select a tag, which will enable editing for it.
              $scope.setSelectedForTag(existing, true);
            }
          }
        }

        if(!$scope.masterTag) {
          $scope.masterTag = {
            master: true,
            content: {
              title: ""
            },
            displayTitle: "All",
            uuid: "0",
            clientData: {}
          }
        }

        if(!$scope.smartMasterTag) {
          $scope.smartMasterTag = {
            master: true,
            smartMaster: true,
            content: {
              title: ""
            },
            displayTitle: "Views",
            uuid: "1",
            clientData: {}
          }
        }

        $scope.masterTag.rawTags = allTags;
        $scope.smartMasterTag.rawTags = smartTags;

        if(!$scope.selectedTag || ($scope.selectedTag && $scope.selectedTag.master)) {
          if($scope.selectedTag && $scope.selectedTag.smartMaster) {
            $scope.selectedTag = $scope.smartMasterTag;
            $scope.setSelectedForTag($scope.masterTag, false);
          } else {
            $scope.selectedTag = $scope.masterTag;
            $scope.setSelectedForTag($scope.smartMasterTag, false);
          }
          $scope.setSelectedForTag($scope.selectedTag, true);
        }

        if($scope.selectedTag.deleted) {
          $scope.selectTag($scope.masterTag);
        }

        $scope.resolveRawTags($scope.masterTag);
        $scope.resolveRawTags($scope.smartMasterTag);
      })
    });

    $scope.deleteTag = function(tag) {
      var isSmartTag = tag.content_type == smartTagContentType;
      var arrayToUse = isSmartTag ? $scope.smartMasterTag.rawTags : $scope.masterTag.rawTags;

      var tag = arrayToUse.filter(function(tagCandidate){
        return tagCandidate.uuid === tag.uuid;
      })[0];

      var deleteChain = [];

      function addChildren(tag) {
        deleteChain.push(tag);
        if(tag.children) {
          for(var child of tag.children) {
            addChildren(child);
          }
        }
      }

      addChildren(tag);

      componentRelay.deleteItems(deleteChain);
    }
  }
}

// required for firefox
HomeCtrl.$$ngIsClass = true;

angular.module('app').controller('HomeCtrl', HomeCtrl);

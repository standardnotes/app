class ActionsMenu {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "directives/actions-menu.html";
    this.scope = {
      item: "="
    };
  }

  controller($scope, modelManager, actionsManager) {
    'ngInject';

    $scope.renderData = {};

    $scope.extensions = actionsManager.extensions.sort((a, b) => {return a.name.toLowerCase() > b.name.toLowerCase()});

    for(let ext of $scope.extensions) {
      ext.loading = true;
      actionsManager.loadExtensionInContextOfItem(ext, $scope.item, function(scopedExtension) {
        ext.loading = false;
      })
    }

    $scope.executeAction = function(action, extension, parentAction) {
      if(action.verb == "nested") {
        if(!action.subrows) {
          action.subrows = $scope.subRowsForAction(action, extension);
        } else {
          action.subrows = null;
        }
        return;
      }
      action.running = true;
      actionsManager.executeAction(action, extension, $scope.item, function(response){
        action.running = false;
        $scope.handleActionResponse(action, response);

        // reload extension actions
        actionsManager.loadExtensionInContextOfItem(extension, $scope.item, function(ext){
          // keep nested state
          if(parentAction) {
            var matchingAction = _.find(ext.actions, {label: parentAction.label});
            matchingAction.subrows = $scope.subRowsForAction(parentAction, extension);
          }
        });
      })
    }

    $scope.handleActionResponse = function(action, response) {
      switch (action.verb) {
        case "render": {
          var item = response.item;
          if(item.content_type == "Note") {
            $scope.renderData.title = item.title;
            $scope.renderData.text = item.text;
            $scope.renderData.showRenderModal = true;
          }
        }
      }
    }


    $scope.subRowsForAction = function(parentAction, extension) {
      if(!parentAction.subactions) {
        return null;
      }
      return parentAction.subactions.map((subaction) => {
        return {
          onClick: ($event) => {
            this.executeAction(subaction, extension, parentAction);
            $event.stopPropagation();
          },
          label: subaction.label,
          subtitle: subaction.desc,
          spinnerClass: subaction.running ? 'info' : null
        }
      })
    }


  }

}

angular.module('app').directive('actionsMenu', () => new ActionsMenu);

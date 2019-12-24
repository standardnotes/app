import { PrivilegesManager } from '@/services/privilegesManager';
import template from '%/directives/actions-menu.pug';

export class ActionsMenu {
  constructor() {
    this.restrict = 'E';
    this.template = template;
    this.scope = {
      item: '='
    };
  }

  /* @ngInject */
  controller($scope, modelManager, actionsManager, privilegesManager) {
    $scope.extensions = actionsManager.extensions.sort((a, b) => {
      return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
    });

    for(let ext of $scope.extensions) {
      ext.loading = true;
      actionsManager.loadExtensionInContextOfItem(ext, $scope.item, function(scopedExtension) {
        ext.loading = false;
      })
    }

    $scope.executeAction = async function(action, extension, parentAction) {
      let run = () => {
        actionsManager.executeAction(action, extension, $scope.item, (response, error) => {
          if(error) {
            return;
          }
  
          action.running = false;
          $scope.handleActionResponse(action, response);
  
          // reload extension actions
          actionsManager.loadExtensionInContextOfItem(extension, $scope.item, function(ext){
            // keep nested state
            // 4/1/2019: We're not going to do this anymore because we're no longer using nested actions for version history,
            // and also because finding the parentAction based on only label is not good enough. Two actions can have same label.
            // We'd need a way to track actions after they are reloaded, but there's no good way to do this.
            // if(parentAction) {
            //   var matchingAction = _.find(ext.actions, {label: parentAction.label});
            //   matchingAction.subrows = $scope.subRowsForAction(parentAction, extension);
            // }
          });
        });
      };

      if(action.verb == "nested") {
        if(!action.subrows) {
          action.subrows = $scope.subRowsForAction(action, extension);
        } else {
          action.subrows = null;
        }
        return;
      }

      action.running = true;

      if(action.access_type == "decrypted") {
        if (await privilegesManager.actionRequiresPrivilege(PrivilegesManager.ActionUseDecryptedActions)) {
          privilegesManager.presentPrivilegesModal(PrivilegesManager.ActionUseDecryptedActions, () => {
            run();
          }, () => {
            action.running = false;
          });
          return;
        }
      }

      run();
    }

    $scope.handleActionResponse = function(action, response) {
      switch (action.verb) {
        case "render": {
          var item = response.item;
          actionsManager.presentRevisionPreviewModal(item.uuid, item.content);
        }
      }
    }


    $scope.subRowsForAction = function(parentAction, extension) {
      if(!parentAction.subactions) {
        return null;
      }
      return parentAction.subactions.map((subaction) => {
        return {
          onClick: () => {
            this.executeAction(subaction, extension, parentAction);
          },
          label: subaction.label,
          subtitle: subaction.desc,
          spinnerClass: subaction.running ? 'info' : null
        }
      })
    }
  }
}

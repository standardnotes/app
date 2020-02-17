import template from '%/directives/actions-menu.pug';
import { PureCtrl } from '@Controllers';

class ActionsMenuCtrl extends PureCtrl {
  /* @ngInject */
  constructor(
    $scope,
    $timeout,
    application,
    appState,
    godService
  ) {
    super($scope, $timeout, application, appState);
    this.godService = godService;
    this.state = {
      extensions: []
    };
  }

  $onInit() {
    super.$onInit();
    this.initProps({
      item: this.item
    });
    this.loadExtensions();
  };

  async loadExtensions() {
    const extensions = this.application.actionsManager.getExtensions().sort((a, b) => {
      return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
    });
    for (const extension of extensions) {
      extension.loading = true;
      await this.application.actionsManager.loadExtensionInContextOfItem(
        extension,
        this.props.item
      );
      extension.loading = false;
    }
    this.setState({
      extensions: extensions
    });
  }

  async executeAction(action, extension) {
    if (action.verb === 'nested') {
      if (!action.subrows) {
        action.subrows = this.subRowsForAction(action, extension);
      } else {
        action.subrows = null;
      }
      return;
    }
    action.running = true;
    const result = await this.application.actionsManager.runAction({
      action: action,
      item: this.props.item,
      passwordRequestHandler: () => {

      }
    });
    if (action.error) {
      return;
    }
    action.running = false;
    this.handleActionResult(action, result);
    await this.application.actionsManager.loadExtensionInContextOfItem(
      extension,
      this.props.item
    );
    this.setState({
      extensions: this.state.extensions
    });
  }

  handleActionResult(action, result) {
    switch (action.verb) {
      case 'render': {
        const item = result.item;
        this.godService.presentRevisionPreviewModal(
          item.uuid,
          item.content
        );
      }
    }
  }

  subRowsForAction(parentAction, extension) {
    if (!parentAction.subactions) {
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
      };
    });
  }
}

export class ActionsMenu {
  constructor() {
    this.restrict = 'E';
    this.template = template;
    this.replace = true;
    this.controller = ActionsMenuCtrl;
    this.controllerAs = 'self';
    this.bindToController = true;
    this.scope = {
      item: '='
    };
  }
}

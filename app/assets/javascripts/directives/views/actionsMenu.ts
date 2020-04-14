import { WebApplication } from '@/ui_models/application';
import { WebDirective } from './../../types';
import template from '%/directives/actions-menu.pug';
import { PureViewCtrl } from '@Views/abstract/pure_view_ctrl';
import { SNItem, Action, SNActionsExtension } from '@/../../../../snjs/dist/@types';
import { ActionResponse } from '@/../../../../snjs/dist/@types/services/actions_service';

type ActionsMenuScope = {
  application: WebApplication
  item: SNItem
}

class ActionsMenuCtrl extends PureViewCtrl implements ActionsMenuScope {

  application!: WebApplication
  item!: SNItem
  public loadingState: Partial<Record<string, boolean>> = {}

  /* @ngInject */
  constructor(
    $timeout: ng.ITimeoutService
  ) {
    super($timeout);
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
    const extensions = this.application.actionsManager!.getExtensions().sort((a, b) => {
      return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
    });
    for (const extension of extensions) {
      this.loadingState[extension.uuid] = true;
      await this.application.actionsManager!.loadExtensionInContextOfItem(
        extension,
        this.props.item
      );
      this.loadingState[extension.uuid] = false;
    }
    this.setState({
      extensions: extensions
    });
  }

  async executeAction(action: Action, extension: SNActionsExtension) {
    if (action.verb === 'nested') {
      if (!action.subrows) {
        action.subrows = this.subRowsForAction(action, extension);
      } else {
        action.subrows = undefined;
      }
      return;
    }
    action.running = true;
    const response = await this.application.actionsManager!.runAction(
      action,
      this.props.item,
      async () => {
        /** @todo */
        return '';
      }
    );
    if (action.error) {
      return;
    }
    action.running = false;
    this.handleActionResponse(action, response);
    await this.application.actionsManager!.loadExtensionInContextOfItem(
      extension,
      this.props.item
    );
    this.setState({
      extensions: this.state.extensions
    });
  }

  handleActionResponse(action: Action, result: ActionResponse) {
    switch (action.verb) {
      case 'render': {
        const item = result.item;
        this.application.presentRevisionPreviewModal(
          item.uuid,
          item.content
        );
      }
    }
  }

  subRowsForAction(parentAction: Action, extension: SNActionsExtension) {
    if (!parentAction.subactions) {
      return undefined;
    }
    return parentAction.subactions.map((subaction) => {
      return {
        onClick: () => {
          this.executeAction(subaction, extension);
        },
        label: subaction.label,
        subtitle: subaction.desc,
        spinnerClass: subaction.running ? 'info' : undefined
      };
    });
  }
}

export class ActionsMenu extends WebDirective {
  constructor() {
    super();
    this.restrict = 'E';
    this.template = template;
    this.replace = true;
    this.controller = ActionsMenuCtrl;
    this.controllerAs = 'self';
    this.bindToController = true;
    this.scope = {
      item: '=',
      application: '='
    };
  }
}

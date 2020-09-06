import { WebApplication } from '@/ui_models/application';
import { WebDirective } from './../../types';
import template from '%/directives/actions-menu.pug';
import { PureViewCtrl } from '@Views/abstract/pure_view_ctrl';
import { SNItem, Action, SNActionsExtension, UuidString } from 'snjs/dist/@types';
import { ActionResponse } from 'snjs/dist/@types/services/actions_service';
import { ActionsExtensionMutator } from 'snjs/dist/@types/models/app/extension';

type ActionsMenuScope = {
  application: WebApplication
  item: SNItem
}

type ActionSubRow = {
  onClick: () => void
  label: string
  subtitle: string
  spinnerClass?: string
}

type UpdateActionParams = {
  running?: boolean
  error?: boolean
  subrows?: ActionSubRow[]
}

type ExtensionState = {
  hidden: boolean
  loading: boolean
  error: boolean
}

type ActionsMenuState = {
  extensions: SNActionsExtension[]
  extensionState: Record<UuidString, ExtensionState>
}

class ActionsMenuCtrl extends PureViewCtrl<{}, ActionsMenuState> implements ActionsMenuScope {
  application!: WebApplication
  item!: SNItem

  /* @ngInject */
  constructor(
    $timeout: ng.ITimeoutService
  ) {
    super($timeout);
  }

  $onInit() {
    super.$onInit();
    this.initProps({
      item: this.item
    });
    this.loadExtensions();
  };

  /** @override */
  getInitialState() {
    const extensions = this.application.actionsManager!.getExtensions().sort((a, b) => {
      return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
    });
    return {
      extensions,
      extensionState: {}
    };
  }

  async loadExtensions() {
    await Promise.all(this.state.extensions.map(async (extension: SNActionsExtension) => {
      await this.setLoadingExtension(extension.uuid, true);
      const updatedExtension = await this.application.actionsManager!.loadExtensionInContextOfItem(
        extension,
        this.item
      );
      if (updatedExtension) {
        await this.updateExtension(updatedExtension!);
      } else {
        await this.setErrorExtension(extension.uuid, true);
      }
      await this.setLoadingExtension(extension.uuid, false);
    }));
  }

  async executeAction(action: Action, extension: SNActionsExtension) {
    if (action.verb === 'nested') {
      if (!action.subrows) {
        const subrows = this.subRowsForAction(action, extension);
        await this.updateAction(action, extension, { subrows });
      }
      return;
    }
    await this.updateAction(action, extension, { running: true });
    const response = await this.application.actionsManager!.runAction(
      action,
      this.item,
      async () => {
        /** @todo */
        return '';
      }
    );
    if (response.error) {
      await this.updateAction(action, extension, { error: true });
      return;
    }
    await this.updateAction(action, extension, { running: false });
    this.handleActionResponse(action, response);
    await this.reloadExtension(extension);
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

  private subRowsForAction(parentAction: Action, extension: SNActionsExtension): ActionSubRow[] | undefined {
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

  private async updateAction(
    action: Action, 
    extension: SNActionsExtension, 
    params: UpdateActionParams
  ) {
    const updatedExtension = await this.application.changeItem(extension.uuid, (mutator) => {
      const extensionMutator = mutator as ActionsExtensionMutator;
      extensionMutator.actions = extension!.actions.map((act) => {
        if (act && params && act.verb === action.verb && act.url === action.url) {
          return {
            ...action,
            running: params?.running,
            error: params?.error,
            subrows: params?.subrows || act?.subrows,
          } as Action;
        }
        return act;
      });
    }) as SNActionsExtension;
    await this.updateExtension(updatedExtension);
  }

  private async updateExtension(extension: SNActionsExtension) {
    const extensions = this.state.extensions.map((ext: SNActionsExtension) => {
      if (extension.uuid === ext.uuid) {
        return extension;
      }
      return ext;
    });
    await this.setState({
      extensions
    });
  }

  private async reloadExtension(extension: SNActionsExtension) {
    const extensionInContext = await this.application.actionsManager!.loadExtensionInContextOfItem(
      extension,
      this.item
    );
    const extensions = this.state.extensions.map((ext: SNActionsExtension) => {
      if (extension.uuid === ext.uuid) {
        return extensionInContext!;
      }
      return ext;
    });
    this.setState({
      extensions
    });
  }

  private async toggleExtensionVisibility(extensionUuid: UuidString) {
    const { extensionState } = this.state;
    extensionState[extensionUuid].hidden = !extensionState[extensionUuid].hidden ?? false;
    await this.setState({
      extensionState
    });
  }

  private isExtensionVisible(extensionUuid: UuidString) {
    const { extensionState } = this.state;
    return extensionState[extensionUuid].hidden ?? false;
  }

  private async setLoadingExtension(extensionUuid: UuidString, value = false) {
    const { extensionState } = this.state;
    extensionState[extensionUuid].loading = value;
    await this.setState({
      extensionState
    });
  }

  private isExtensionLoading(extensionUuid: UuidString) {
    const { extensionState } = this.state;
    return extensionState[extensionUuid].loading ?? false;
  }

  private async setErrorExtension(extensionUuid: UuidString, value = false) {
    const { extensionState } = this.state;
    extensionState[extensionUuid].error = value;
    await this.setState({
      extensionState
    });
  }

  private extensionHasError(extensionUuid: UuidString) {
    const { extensionState } = this.state;
    return extensionState[extensionUuid].error ?? false;
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

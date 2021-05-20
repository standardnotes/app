import { WebApplication } from '@/ui_models/application';
import { WebDirective } from './../../types';
import template from '%/directives/actions-menu.pug';
import { PureViewCtrl } from '@Views/abstract/pure_view_ctrl';
import { SNItem, Action, SNActionsExtension, UuidString } from '@standardnotes/snjs';
import { ActionResponse } from '@standardnotes/snjs';
import { ActionsExtensionMutator } from '@standardnotes/snjs';

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

type ExtensionState = {
  loading: boolean
  error: boolean
}

type ActionsMenuState = {
  extensions: SNActionsExtension[]
  extensionsState: Record<UuidString, ExtensionState>
  selectedActionId?: number
  menu: {
    uuid: UuidString,
    name: string,
    loading: boolean,
    error: boolean,
    hidden: boolean,
    actions: (Action & {
      subrows?: ActionSubRow[]
    })[]
  }[]
}

class ActionsMenuCtrl extends PureViewCtrl<unknown, ActionsMenuState> implements ActionsMenuScope {
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
    this.autorun(() => {
      this.rebuildMenu({
        hiddenExtensions: this.appState.actionsMenu.hiddenExtensions
      });
    });
  }

  /** @override */
  getInitialState() {
    const extensions = this.application.actionsManager!.getExtensions().sort((a, b) => {
      return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
    });
    const extensionsState: Record<UuidString, ExtensionState> = {};
    extensions.map((extension) => {
      extensionsState[extension.uuid] = {
        loading: false,
        error: false,
      };
    });
    return {
      extensions,
      extensionsState,
      hiddenExtensions: {},
      menu: [],
    };
  }

  rebuildMenu({
    extensions = this.state.extensions,
    extensionsState = this.state.extensionsState,
    selectedActionId = this.state.selectedActionId,
    hiddenExtensions = this.appState.actionsMenu.hiddenExtensions,
  } = {}) {
    return this.setState({
      extensions,
      extensionsState,
      selectedActionId,
      menu: extensions.map(extension => {
        const state = extensionsState[extension.uuid];
        const hidden = hiddenExtensions[extension.uuid];
        return {
          uuid: extension.uuid,
          name: extension.name,
          loading: state?.loading ?? false,
          error: state?.error ?? false,
          hidden: hidden ?? false,
          deprecation: extension.deprecation!,
          actions: extension.actionsWithContextForItem(this.item).map(action => {
            if (action.id === selectedActionId) {
              return {
                ...action,
                subrows: this.subRowsForAction(action, extension)
              };
            } else {
              return action;
            }
          })
        };
      })
    });
  }

  async loadExtensions() {
    await Promise.all(this.state.extensions.map(async (extension: SNActionsExtension) => {
      this.setLoadingExtension(extension.uuid, true);
      const updatedExtension = await this.application.actionsManager!.loadExtensionInContextOfItem(
        extension,
        this.item
      );
      if (updatedExtension) {
        await this.updateExtension(updatedExtension!);
      } else {
        this.setErrorExtension(extension.uuid, true);
      }
      this.setLoadingExtension(extension.uuid, false);
    }));
  }

  async executeAction(action: Action, extensionUuid: UuidString) {
    if (action.verb === 'nested') {
      this.rebuildMenu({
        selectedActionId: action.id
      });
      return;
    }
    const extension = this.application.findItem(extensionUuid) as SNActionsExtension;
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

  private subRowsForAction(parentAction: Action, extension: Pick<SNActionsExtension, 'uuid'>): ActionSubRow[] | undefined {
    if (!parentAction.subactions) {
      return undefined;
    }
    return parentAction.subactions.map((subaction) => {
      return {
        id: subaction.id,
        onClick: () => {
          this.executeAction(subaction, extension.uuid);
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
    params: {
      running?: boolean
      error?: boolean
    }
  ) {
    const updatedExtension = await this.application.changeItem(extension.uuid, (mutator) => {
      const extensionMutator = mutator as ActionsExtensionMutator;
      extensionMutator.actions = extension!.actions.map((act) => {
        if (act && params && act.verb === action.verb && act.url === action.url) {
          return {
            ...action,
            running: params?.running,
            error: params?.error,
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
    await this.rebuildMenu({
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
    this.rebuildMenu({
      extensions
    });
  }

  public toggleExtensionVisibility(extensionUuid: UuidString) {
    this.appState.actionsMenu.toggleExtensionVisibility(extensionUuid);
  }

  private setLoadingExtension(extensionUuid: UuidString, value = false) {
    const { extensionsState } = this.state;
    extensionsState[extensionUuid].loading = value;
    this.rebuildMenu({
      extensionsState
    });
  }

  private setErrorExtension(extensionUuid: UuidString, value = false) {
    const { extensionsState } = this.state;
    extensionsState[extensionUuid].error = value;
    this.rebuildMenu({
      extensionsState
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

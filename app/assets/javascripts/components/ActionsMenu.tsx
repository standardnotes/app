import { WebApplication } from '@/ui_models/application';
import {
  Action,
  SNActionsExtension,
  UuidString,
  CopyPayload,
  SNNote,
  ListedAccountInfoToActionExtension,
  ListedAccountInfo,
} from '@standardnotes/snjs';
import { ActionResponse } from '@standardnotes/snjs';
import { render } from 'preact';
import { PureComponent } from './Abstract/PureComponent';
import { MenuRow } from './MenuRow';
import { RevisionPreviewModal } from './RevisionPreviewModal';

type ActionSubRow = {
  onClick: () => void;
  label: string;
  subtitle: string;
  spinnerClass?: string;
};

type ExtensionState = {
  loading: boolean;
  error: boolean;
};

type MenuItem = {
  uuid: UuidString;
  name: string;
  loading: boolean;
  error: boolean;
  hidden: boolean;
  deprecation?: string;
  extension: SNActionsExtension;
  actions: (Action & {
    subrows?: ActionSubRow[];
  })[];
};

type ActionState = {
  error: boolean;
  running: boolean;
};

type ActionsMenuState = {
  extensions: SNActionsExtension[];
  extensionsState: Record<UuidString, ExtensionState>;
  hiddenExtensions: Record<UuidString, boolean>;
  selectedActionId?: number;
  menuItems: MenuItem[];
  actionState: Record<number, ActionState>;
};

type Props = {
  application: WebApplication;
  item: SNNote;
};

export class ActionsMenu extends PureComponent<Props, ActionsMenuState> {
  constructor(props: Props) {
    super(props, props.application);

    this.state = {
      extensions: [],
      extensionsState: {},
      hiddenExtensions: {},
      menuItems: [],
      actionState: {},
    };

    this.loadExtensions();
  }

  private async loadExtensions(): Promise<void> {
    const resolvedExtensions = await Promise.all([
      ...(await this.getResolvedNonListedExtensions()),
      ...(await this.getResolvedListedExtensions()),
    ]);

    const extensionsState: Record<UuidString, ExtensionState> = {};
    resolvedExtensions.map((extension) => {
      extensionsState[extension.uuid] = {
        loading: false,
        error: false,
      };
    });

    this.setState({
      extensions: resolvedExtensions,
      extensionsState: extensionsState,
    });

    this.rebuildMenuState({
      extensions: resolvedExtensions,
      extensionsState: extensionsState,
    });
  }

  private extensionsByRemovingActions(
    extension: SNActionsExtension
  ): SNActionsExtension {
    return new SNActionsExtension(
      CopyPayload(extension.payload, {
        content: {
          ...extension.payload.safeContent,
          actions: [],
        },
      })
    );
  }

  private async getResolvedNonListedExtensions(): Promise<
    SNActionsExtension[]
  > {
    const nonListedExtensions = this.props.application.actionsManager
      .getExtensions()
      .sort((a, b) => {
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
      })
      .map((extension) => {
        return this.extensionsByRemovingActions(extension);
      });

    const resolved = await Promise.all(
      nonListedExtensions.map((ext) => {
        return this.props.application.actionsManager.loadExtensionInContextOfItem(
          ext,
          this.props.item
        );
      })
    );
    return resolved.filter((ext) => ext != undefined) as SNActionsExtension[];
  }

  private async getResolvedListedExtensions(): Promise<SNActionsExtension[]> {
    const listedAccountEntries =
      await this.props.application.getListedAccounts();
    const accountInfos = await Promise.all(
      listedAccountEntries.map((account) => {
        return this.props.application.getListedAccountInfo(
          account,
          this.props.item.uuid
        );
      })
    );
    const listedExtensions = (
      accountInfos.filter((info) => info != undefined) as ListedAccountInfo[]
    ).map((accountInfo) => ListedAccountInfoToActionExtension(accountInfo));
    return listedExtensions;
  }

  componentDidMount() {
    this.autorun(() => {
      this.rebuildMenuState({
        hiddenExtensions: this.appState.actionsMenu.hiddenExtensions,
      });
    });
  }

  rebuildMenuState({
    extensions = this.state.extensions,
    extensionsState = this.state.extensionsState,
    selectedActionId = this.state.selectedActionId,
    hiddenExtensions = this.appState.actionsMenu.hiddenExtensions,
  } = {}) {
    return this.setState({
      extensions,
      extensionsState,
      selectedActionId,
      menuItems: extensions.map((extension) => {
        const state = extensionsState[extension.uuid];
        const hidden = hiddenExtensions[extension.uuid];
        const item: MenuItem = {
          uuid: extension.uuid,
          name: extension.name,
          loading: state?.loading ?? false,
          error: state?.error ?? false,
          hidden: hidden ?? false,
          extension,
          deprecation: extension.deprecation!,
          actions: extension
            .actionsWithContextForItem(this.props.item)
            .map((action) => {
              if (action.id === selectedActionId) {
                return {
                  ...action,
                  subrows: this.subRowsForAction(action, extension),
                };
              } else {
                return action;
              }
            }),
        };
        return item;
      }),
    });
  }

  executeAction = async (action: Action, extension: SNActionsExtension) => {
    if (action.verb === 'nested') {
      this.rebuildMenuState({
        selectedActionId: action.id,
      });
      return;
    }
    this.updateActionState(action, { running: true, error: false });

    const response = await this.props.application.actionsManager.runAction(
      action,
      this.props.item,
      async () => {
        /** @todo */
        return '';
      }
    );
    if (response.error) {
      this.updateActionState(action, { error: true, running: false });
      return;
    }

    this.updateActionState(action, { running: false, error: false });
    this.handleActionResponse(action, response);
    await this.reloadExtension(extension);
  };

  handleActionResponse(action: Action, result: ActionResponse) {
    switch (action.verb) {
      case 'render': {
        const item = result.item;
        render(
          <RevisionPreviewModal
            application={this.application}
            uuid={item.uuid}
            content={item.content}
          />,
          document.body.appendChild(document.createElement('div'))
        );
      }
    }
  }

  private subRowsForAction(
    parentAction: Action,
    extension: SNActionsExtension
  ): ActionSubRow[] | undefined {
    if (!parentAction.subactions) {
      return undefined;
    }
    return parentAction.subactions.map((subaction) => {
      return {
        id: subaction.id,
        onClick: () => {
          this.executeAction(subaction, extension);
        },
        label: subaction.label,
        subtitle: subaction.desc,
        spinnerClass: this.getActionState(subaction).running
          ? 'info'
          : undefined,
      };
    });
  }

  private updateActionState(action: Action, actionState: ActionState): void {
    const state = this.state.actionState;
    state[action.id] = actionState;
    this.setState({ actionState: state });
  }

  private getActionState(action: Action): ActionState {
    return this.state.actionState[action.id] || {};
  }

  private async updateExtension(extension: SNActionsExtension) {
    const extensions = this.state.extensions.map((ext: SNActionsExtension) => {
      if (extension.uuid === ext.uuid) {
        return extension;
      }
      return ext;
    });
    this.rebuildMenuState({
      extensions,
    });
  }

  private async reloadExtension(extension: SNActionsExtension) {
    const extensionInContext =
      await this.props.application.actionsManager.loadExtensionInContextOfItem(
        extension,
        this.props.item
      );
    const extensions = this.state.extensions.map((ext: SNActionsExtension) => {
      if (extension.uuid === ext.uuid) {
        return extensionInContext!;
      }
      return ext;
    });
    this.rebuildMenuState({
      extensions,
    });
  }

  public toggleExtensionVisibility(extensionUuid: UuidString) {
    this.appState.actionsMenu.toggleExtensionVisibility(extensionUuid);
  }

  private setLoadingExtension(extensionUuid: UuidString, value = false) {
    const { extensionsState } = this.state;
    extensionsState[extensionUuid].loading = value;
    this.rebuildMenuState({
      extensionsState,
    });
  }

  private setErrorExtension(extensionUuid: UuidString, value = false) {
    const { extensionsState } = this.state;
    extensionsState[extensionUuid].error = value;
    this.rebuildMenuState({
      extensionsState,
    });
  }

  renderMenuItem(menuItem: MenuItem) {
    return (
      <div>
        <div
          key={menuItem.uuid}
          className="sk-menu-panel-header"
          onClick={($event) => {
            this.toggleExtensionVisibility(menuItem.uuid);
            $event.stopPropagation();
          }}
        >
          <div className="sk-menu-panel-column">
            <div className="sk-menu-panel-header-title">{menuItem.name}</div>
            {menuItem.hidden && <div>…</div>}
            {menuItem.deprecation && !menuItem.hidden && (
              <div className="sk-menu-panel-header-subtitle">
                {menuItem.deprecation}
              </div>
            )}
          </div>

          {menuItem.loading && <div className="sk-spinner small loading" />}
        </div>

        <div>
          {menuItem.error && !menuItem.hidden && (
            <MenuRow
              faded={true}
              label="Error loading actions"
              subtitle="Please try again later."
            />
          )}

          {!menuItem.actions.length && !menuItem.hidden && (
            <MenuRow faded={true} label="No Actions Available" />
          )}

          {!menuItem.hidden &&
            !menuItem.loading &&
            !menuItem.error &&
            menuItem.actions.map((action, index) => {
              return (
                <MenuRow
                  key={index}
                  action={() => {
                    this.executeAction(action, menuItem.extension);
                  }}
                  label={action.label}
                  disabled={this.getActionState(action).running}
                  spinnerClass={
                    this.getActionState(action).running ? 'info' : undefined
                  }
                  subRows={action.subrows}
                  subtitle={action.desc}
                >
                  {action.access_type && (
                    <div className="sk-sublabel">
                      {'Uses '}
                      <strong>{action.access_type}</strong>
                      {' access to this note.'}
                    </div>
                  )}
                </MenuRow>
              );
            })}
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="sn-component">
        <div className="sk-menu-panel dropdown-menu">
          {this.state.extensions.length == 0 && <MenuRow label="No Actions" />}
          {this.state.menuItems.map((extension) =>
            this.renderMenuItem(extension)
          )}
        </div>
      </div>
    );
  }
}

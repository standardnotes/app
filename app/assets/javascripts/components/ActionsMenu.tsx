import { WebApplication } from '@/ui_models/application';
import {
  SNItem,
  Action,
  SNActionsExtension,
  UuidString,
  CopyPayload,
  SNNote,
} from '@standardnotes/snjs';
import { ActionResponse } from '@standardnotes/snjs';
import { render } from 'preact';
import { PureComponent } from './Abstract/PureComponent';
import { MenuRow } from './MenuRow';
import { RevisionPreviewModal } from './RevisionPreviewModal';
type ActionsMenuScope = {
  application: WebApplication;
  item: SNItem;
};

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

export class ActionsMenu
  extends PureComponent<Props, ActionsMenuState>
  implements ActionsMenuScope
{
  application!: WebApplication;
  item!: SNItem;

  constructor(props: Props) {
    super(props, props.application);

    const extensions = props.application.actionsManager
      .getExtensions()
      .sort((a, b) => {
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
      })
      .map((extension) => {
        return new SNActionsExtension(
          CopyPayload(extension.payload, {
            content: {
              ...extension.payload.safeContent,
              actions: [],
            },
          })
        );
      });
    const extensionsState: Record<UuidString, ExtensionState> = {};
    extensions.map((extension) => {
      extensionsState[extension.uuid] = {
        loading: true,
        error: false,
      };
    });

    this.state = {
      extensions,
      extensionsState,
      hiddenExtensions: {},
      menuItems: [],
      actionState: {},
    };
  }

  componentDidMount() {
    this.loadExtensions();
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

  async loadExtensions() {
    await Promise.all(
      this.state.extensions.map(async (extension: SNActionsExtension) => {
        this.setLoadingExtension(extension.uuid, true);
        const updatedExtension =
          await this.props.application.actionsManager.loadExtensionInContextOfItem(
            extension,
            this.props.item
          );
        if (updatedExtension) {
          await this.updateExtension(updatedExtension!);
        } else {
          this.setErrorExtension(extension.uuid, true);
        }
        this.setLoadingExtension(extension.uuid, false);
      })
    );
  }

  executeAction = async (action: Action, extensionUuid: UuidString) => {
    if (action.verb === 'nested') {
      this.rebuildMenuState({
        selectedActionId: action.id,
      });
      return;
    }

    const extension = this.props.application.findItem(
      extensionUuid
    ) as SNActionsExtension;

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
    extension: Pick<SNActionsExtension, 'uuid'>
  ): ActionSubRow[] | undefined {
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
    await this.rebuildMenuState({
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

  renderMenuItem(item: MenuItem) {
    return (
      <div>
        <div
          key={item.uuid}
          className="sk-menu-panel-header"
          onClick={($event) => {
            this.toggleExtensionVisibility(item.uuid);
            $event.stopPropagation();
          }}
        >
          <div className="sk-menu-panel-column">
            <div className="sk-menu-panel-header-title">{item.name}</div>
            {item.hidden && <div>…</div>}
            {item.deprecation && !item.hidden && (
              <div className="sk-menu-panel-header-subtitle">
                {item.deprecation}
              </div>
            )}
          </div>

          {item.loading && <div className="sk-spinner small loading" />}
        </div>

        <div>
          {item.error && !item.hidden && (
            <MenuRow
              faded={true}
              label="Error loading actions"
              subtitle="Please try again later."
            />
          )}

          {!item.actions.length && !item.hidden && (
            <MenuRow faded={true} label="No Actions Available" />
          )}

          {!item.hidden &&
            !item.loading &&
            !item.error &&
            item.actions.map((action, index) => {
              return (
                <MenuRow
                  key={index}
                  action={this.executeAction as never}
                  actionArgs={[action, item.uuid]}
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
          {this.state.extensions.length == 0 && (
            <a
              href="https://standardnotes.com/plans"
              rel="noopener"
              target="blank"
              className="no-decoration"
            >
              <MenuRow label="Download Actions" />
            </a>
          )}
          {this.state.menuItems.map((extension) =>
            this.renderMenuItem(extension)
          )}
        </div>
      </div>
    );
  }
}

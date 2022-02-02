import { WebApplication } from '@/ui_models/application';
import {
  Action,
  SNActionsExtension,
  UuidString,
  CopyPayload,
  SNNote,
  ListedAccount,
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

type ActionItem = Action & {
  running?: boolean;
  subrows?: ActionSubRow[];
};

type MenuSection = {
  uuid: UuidString;
  name: string;
  loading?: boolean;
  error?: boolean;
  hidden?: boolean;
  deprecation?: string;
  extension?: SNActionsExtension;
  actions?: ActionItem[];
  listedAccount?: ListedAccount;
};

type State = {
  menuSections: MenuSection[];
  selectedActionIdentifier?: string;
};

type Props = {
  application: WebApplication;
  note: SNNote;
};

export class ActionsMenu extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props, props.application);

    this.state = {
      menuSections: [],
    };

    this.loadExtensions();
  }

  private async loadExtensions(): Promise<void> {
    const unresolvedListedSections =
      await this.getNonresolvedListedMenuSections();
    const unresolvedGenericSections =
      await this.getNonresolvedGenericMenuSections();
    this.setState(
      {
        menuSections: unresolvedListedSections.concat(
          unresolvedGenericSections
        ),
      },
      () => {
        this.state.menuSections.forEach((menuSection) => {
          this.resolveMenuSection(menuSection);
        });
      }
    );
  }

  private async getNonresolvedGenericMenuSections(): Promise<MenuSection[]> {
    const genericExtensions = this.props.application.actionsManager
      .getExtensions()
      .sort((a, b) => {
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
      });

    return genericExtensions.map((extension) => {
      const menuSection: MenuSection = {
        uuid: extension.uuid,
        name: extension.name,
        extension: extension,
        loading: true,
        hidden: this.appState.actionsMenu.hiddenSections[extension.uuid],
      };
      return menuSection;
    });
  }

  private async getNonresolvedListedMenuSections(): Promise<MenuSection[]> {
    const listedAccountEntries =
      await this.props.application.getListedAccounts();
    return listedAccountEntries.map((entry) => {
      const menuSection: MenuSection = {
        uuid: entry.authorId,
        name: `Listed ${entry.authorId}`,
        loading: true,
        listedAccount: entry,
        hidden: this.appState.actionsMenu.hiddenSections[entry.authorId],
      };
      return menuSection;
    });
  }

  private resolveMenuSection(menuSection: MenuSection): void {
    if (menuSection.listedAccount) {
      this.props.application
        .getListedAccountInfo(menuSection.listedAccount, this.props.note.uuid)
        .then((accountInfo) => {
          if (!accountInfo) {
            this.promoteMenuSection({
              ...menuSection,
              loading: false,
            });
            return;
          }
          const existingMenuSection = this.state.menuSections.find(
            (item) => item.uuid === menuSection.listedAccount?.authorId
          ) as MenuSection;
          const resolvedMenuSection: MenuSection = {
            ...existingMenuSection,
            loading: false,
            error: false,
            name: accountInfo.display_name,
            actions: accountInfo?.actions,
          };
          this.promoteMenuSection(resolvedMenuSection);
        });
    } else if (menuSection.extension) {
      this.props.application.actionsManager
        .loadExtensionInContextOfItem(menuSection.extension, this.props.note)
        .then((resolvedExtension) => {
          if (!resolvedExtension) {
            this.promoteMenuSection({
              ...menuSection,
              loading: false,
            });
            return;
          }

          const actions = resolvedExtension
            .actionsWithContextForItem(this.props.note)
            .map((action) => {
              return {
                ...action,
                subrows:
                  this.idForAction(action) ===
                  this.state.selectedActionIdentifier
                    ? this.subRowsForAction(action, resolvedExtension)
                    : [],
              };
            });

          const resolvedMenuSection: MenuSection = {
            ...menuSection,
            actions: actions,
            deprecation: resolvedExtension.deprecation,
            loading: false,
            error: false,
          };
          this.promoteMenuSection(resolvedMenuSection);
        });
    }
  }

  private promoteMenuSection(newItem: MenuSection): void {
    const menuSections = this.state.menuSections.map((menuSection) => {
      if (menuSection.uuid === newItem.uuid) {
        return newItem;
      } else {
        return menuSection;
      }
    });
    this.setState({ menuSections });
  }

  private promoteAction(newAction: Action, section: MenuSection): void {
    const newSection: MenuSection = {
      ...section,
      actions: section.actions?.map((action) => {
        if (action.url === newAction.url) {
          return newAction;
        } else {
          return action;
        }
      }),
    };
    this.promoteMenuSection(newSection);
  }

  private idForAction(action: Action) {
    return `${action.label}:${action.verb}:${action.desc}`;
  }

  executeAction = async (action: Action, section: MenuSection) => {
    if (action.verb === 'nested') {
      this.setState(
        {
          selectedActionIdentifier: this.idForAction(action),
        },
        () => {
          this.resolveMenuSection(section);
        }
      );
      return;
    }

    this.promoteAction(
      {
        ...action,
        running: true,
      },
      section
    );

    const response = await this.props.application.actionsManager.runAction(
      action,
      this.props.note,
      async () => {
        return '';
      }
    );

    this.promoteAction(
      {
        ...action,
        running: false,
      },
      section
    );

    if (response.error) {
      return;
    }

    this.handleActionResponse(action, response);
    this.resolveMenuSection(section);
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
        onClick: () => {
          this.executeAction(subaction, extension);
        },
        label: subaction.label,
        subtitle: subaction.desc,
      };
    });
  }

  public toggleSectionVisibility(menuSection: MenuSection) {
    this.appState.actionsMenu.toggleSectionVisibility(menuSection.uuid);
    this.promoteMenuSection({
      ...menuSection,
      hidden: !menuSection.hidden,
    });
  }

  renderMenuSection(section: MenuSection) {
    return (
      <div>
        <div
          key={section.uuid}
          className="sk-menu-panel-header"
          onClick={($event) => {
            this.toggleSectionVisibility(section);
            $event.stopPropagation();
          }}
        >
          <div className="sk-menu-panel-column">
            <div className="sk-menu-panel-header-title">{section.name}</div>
            {section.hidden && <div>…</div>}
            {section.deprecation && !section.hidden && (
              <div className="sk-menu-panel-header-subtitle">
                {section.deprecation}
              </div>
            )}
          </div>

          {section.loading && <div className="sk-spinner small loading" />}
        </div>

        <div>
          {section.error && !section.hidden && (
            <MenuRow
              faded={true}
              label="Error loading actions"
              subtitle="Please try again later."
            />
          )}

          {!section.actions?.length && !section.hidden && (
            <MenuRow faded={true} label="No Actions Available" />
          )}

          {!section.hidden &&
            !section.loading &&
            !section.error &&
            section.actions?.map((action, index) => {
              return (
                <MenuRow
                  key={index}
                  action={() => {
                    this.executeAction(action, section);
                  }}
                  label={action.label}
                  disabled={action.running}
                  spinnerClass={action.running ? 'info' : undefined}
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
          {this.state.menuSections.length == 0 && (
            <MenuRow label="No Actions" />
          )}
          {this.state.menuSections.map((extension) =>
            this.renderMenuSection(extension)
          )}
        </div>
      </div>
    );
  }
}

import { ApplicationGroup } from '@/ui_models/application_group';
import { WebApplication } from '@/ui_models/application';
import { ApplicationDescriptor } from '@standardnotes/snjs';
import { PureComponent } from '@/components/Abstract/PureComponent';

type Props = {
  application: WebApplication;
  mainApplicationGroup: ApplicationGroup;
};

type State = {
  descriptors: ApplicationDescriptor[];
  editingDescriptor?: ApplicationDescriptor;
};

export class AccountSwitcher extends PureComponent<Props, State> {
  private removeAppGroupObserver: any;
  activeApplication!: WebApplication;

  constructor(props: Props) {
    super(props, props.application);
    this.removeAppGroupObserver =
      props.mainApplicationGroup.addApplicationChangeObserver(() => {
        this.activeApplication = props.mainApplicationGroup
          .primaryApplication as WebApplication;
        this.reloadApplications();
      });
  }

  reloadApplications() {
    this.setState({
      descriptors: this.props.mainApplicationGroup.getDescriptors(),
    });
  }

  addNewApplication = () => {
    this.dismiss();
    this.props.mainApplicationGroup.addNewApplication();
  };

  selectDescriptor = (descriptor: ApplicationDescriptor) => {
    this.dismiss();
    this.props.mainApplicationGroup.loadApplicationForDescriptor(descriptor);
  };

  inputForDescriptor(descriptor: ApplicationDescriptor) {
    return document.getElementById(`input-${descriptor.identifier}`);
  }

  renameDescriptor = ($event: Event, descriptor: ApplicationDescriptor) => {
    $event.stopPropagation();
    this.setState({ editingDescriptor: descriptor });
    const input = this.inputForDescriptor(descriptor);
    input?.focus();
  };

  submitRename = () => {
    this.props.mainApplicationGroup.renameDescriptor(
      this.state.editingDescriptor!,
      this.state.editingDescriptor!.label
    );
    this.setState({ editingDescriptor: undefined });
  };

  deinit() {
    super.deinit();
    this.removeAppGroupObserver();
    this.removeAppGroupObserver = undefined;
  }

  dismiss = () => {
    this.dismissModal();
  };

  render() {
    return (
      <>
        <div onClick={this.dismiss} className="sk-modal-background" />
        <div id="account-switcher" className="sk-modal-content">
          <div className="sn-component">
            <div id="menu-panel" className="sk-menu-panel">
              <div className="sk-menu-panel-header">
                <div className="sk-menu-panel-column">
                  <div className="sk-menu-panel-header-title">
                    Account Switcher
                  </div>
                </div>
                <div className="sk-menu-panel-column">
                  <a onClick={this.addNewApplication} className="sk-label info">
                    Add Account
                  </a>
                </div>
              </div>
              {this.state.descriptors.map((descriptor) => {
                return (
                  <div
                    key={descriptor.identifier}
                    onClick={() => this.selectDescriptor(descriptor)}
                    className="sk-menu-panel-row"
                  >
                    <div className="sk-menu-panel-column stretch">
                      <div className="left">
                        {descriptor.identifier ==
                          this.activeApplication.identifier && (
                          <div className="sk-menu-panel-column">
                            <div className="sk-circle small success" />
                          </div>
                        )}
                        <div className="sk-menu-panel-column stretch">
                          <input
                            value={descriptor.label}
                            disabled={
                              descriptor !== this.state.editingDescriptor
                            }
                            onKeyUp={(event) =>
                              event.keyCode == 13 && this.submitRename()
                            }
                            id={`input-${descriptor.identifier}`}
                            spellcheck={false}
                            className="sk-label clickable"
                          />

                          {descriptor.identifier ==
                            this.activeApplication.identifier && (
                            <div className="sk-sublabel">
                              Current Application
                            </div>
                          )}
                        </div>

                        {descriptor.identifier ==
                          this.activeApplication.identifier && (
                          <div className="sk-menu-panel-column">
                            <button
                              onClick={(event) =>
                                this.renameDescriptor(event, descriptor)
                              }
                              className="sn-button success"
                            >
                              Rename
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </>
    );
  }
}

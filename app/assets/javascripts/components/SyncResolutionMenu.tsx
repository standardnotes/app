import { WebApplication } from '@/ui_models/application';
import { PureComponent } from './Abstract/PureComponent';

type Props = {
  application: WebApplication;
  close: () => void;
};

export class SyncResolutionMenu extends PureComponent<Props> {
  constructor(props: Props) {
    super(props, props.application);
  }

  close = () => {
    this.props.close();
  };

  render() {
    return (
      <div className="sn-component">
        <div id="sync-resolution-menu" className="sk-panel sk-panel-right">
          <div className="sk-panel-header">
            <div className="sk-panel-header-title">Out of Sync</div>
            <a onClick={this.close} className="sk-a info close-button">
              Close
            </a>
          </div>
          <div className="sk-panel-content">
            <div className="sk-panel-section">
              <div className="sk-panel-row sk-p">
                We've detected that the data in the current application session
                may not match the data on the server. An attempt was made to
                auto-resolve the issue, but it was unable to reconcile the
                differences.
              </div>
              <div className="sk-p sk-panel-row">
                <div className="sk-panel-column">
                  <strong className="sk-panel-row">
                    Option 1 — Restart Application:
                  </strong>
                  <div className="sk-p">
                    Quit the application and re-open it. Sometimes, this may
                    resolve the issue.
                  </div>
                </div>
              </div>
              <div className="sk-p sk-panel-row">
                <div className="sk-panel-column">
                  <strong className="sk-panel-row">
                    Option 2 — Sign Out and Back In:
                  </strong>
                  <div className="sk-p">
                    Sign out of your account, then sign back in. This will
                    ensure your data is consistent with the server. Be sure to
                    download a backup of your data before doing so.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

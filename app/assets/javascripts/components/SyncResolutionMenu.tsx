import { WebApplication } from '@/ui_models/application';
import { PureComponent } from './Abstract/PureComponent';
import { Fragment } from 'preact';

type Props = {
  application: WebApplication;
  close: () => void;
};

export class SyncResolutionMenu extends PureComponent<Props> {
  private status: Partial<{
    backupFinished: boolean;
    resolving: boolean;
    attemptedResolution: boolean;
    success: boolean;
    fail: boolean;
  }> = {};

  constructor(props: Props) {
    super(props, props.application);
  }

  downloadBackup(encrypted: boolean) {
    this.props.application.getArchiveService().downloadBackup(encrypted);
    this.status.backupFinished = true;
  }

  skipBackup() {
    this.status.backupFinished = true;
  }

  async performSyncResolution() {
    this.status.resolving = true;
    await this.props.application.resolveOutOfSync();

    this.status.resolving = false;
    this.status.attemptedResolution = true;
    if (this.props.application.isOutOfSync()) {
      this.status.fail = true;
    } else {
      this.status.success = true;
    }
  }

  close() {
    this.props.close();
  }

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
                We've detected that the data on the server may not match{'\n'}
                the data in the current application session.
              </div>
              <div className="sk-p sk-panel-row">
                <div className="sk-panel-column">
                  <strong className="sk-panel-row">
                    Option 1 — Restart App:
                  </strong>
                  <div className="sk-p">
                    Quit the application and re-open it.{'\n'}Sometimes, this
                    may resolve the issue.
                  </div>
                </div>
              </div>
              <div className="sk-p sk-panel-row">
                <div className="sk-panel-column">
                  <strong className="sk-panel-row">
                    Option 2 (recommended) — Sign Out:
                  </strong>
                  <div className="sk-p">
                    Sign out of your account, then sign back in.{'\n'}This will
                    ensure your data is consistent with the server.
                  </div>
                  Be sure to download a backup of your data before doing so.
                </div>
              </div>
              <div className="sk-p sk-panel-row">
                <div className="sk-panel-column">
                  <strong className="sk-panel-row">
                    Option 3 — Sync Resolution:
                  </strong>
                  <div className="sk-p">
                    We can attempt to reconcile changes by downloading all data
                    from the{'\n'}server. No existing data will be overwritten.
                    If the local contents of{'\n'}an item differ from what the
                    server has, a conflicted copy will be created.
                  </div>
                </div>
              </div>
              {!this.status.backupFinished && (
                <Fragment>
                  <div className="sk-p sk-panel-row">
                    Please download a backup before we attempt to{'\n'}perform a
                    full account sync resolution.
                  </div>
                  <div className="sk-panel-row">
                    <div className="flex gap-2">
                      <button
                        onClick={() => this.downloadBackup(true)}
                        className="sn-button small info"
                      >
                        Encrypted
                      </button>
                      <button
                        onClick={() => this.downloadBackup(false)}
                        className="sn-button small info"
                      >
                        Decrypted
                      </button>
                      <button
                        onClick={this.skipBackup}
                        className="sn-button small danger"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                </Fragment>
              )}

              {this.status.backupFinished && (
                <div>
                  {!this.status.resolving && !this.status.attemptedResolution && (
                    <div className="sk-panel-row">
                      <button
                        onClick={this.performSyncResolution}
                        className="sn-button small info"
                      >
                        Perform Sync Resolution
                      </button>
                    </div>
                  )}
                  {this.status.resolving && (
                    <div className="sk-panel-row justify-left">
                      <div className="sk-horizontal-group">
                        <div className="sk-spinner small info" />
                        <div className="sk-label">
                          Attempting sync resolution...
                        </div>
                      </div>
                    </div>
                  )}
                  {this.status.fail && (
                    <div className="sk-panel-column">
                      <div className="sk-panel-row sk-label danger">
                        Sync Resolution Failed
                      </div>
                      <div className="sk-p sk-panel-row">
                        We attempted to reconcile local content and server
                        content, but were{'\n'}unable to do so. At this point,
                        we recommend signing out of your account{'\n'}and
                        signing back in. You may wish to download a data backup
                        before doing so.
                      </div>
                    </div>
                  )}
                  {this.status.success && (
                    <div className="sk-panel-column">
                      <div className="sk-panel-row sk-label success">
                        Sync Resolution Success
                      </div>
                      <div className="sk-p sk-panel-row">
                        Your local data is now in sync with the server. You may
                        close this window.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

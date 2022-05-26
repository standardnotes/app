import { WebApplication } from '@/UIModels/Application'
import { SNComponent } from '@standardnotes/snjs'
import { Component } from 'react'

interface Props {
  application: WebApplication
  callback: (approved: boolean) => void
  dismiss: () => void
  component: SNComponent
  permissionsString: string
}

class PermissionsModal extends Component<Props> {
  accept = () => {
    this.props.callback(true)
    this.props.dismiss()
  }

  deny = () => {
    this.props.callback(false)
    this.props.dismiss()
  }

  override render() {
    return (
      <div className="sk-modal">
        <div onClick={this.deny} className="sk-modal-background" />
        <div id="permissions-modal" className="sk-modal-content">
          <div className="sn-component">
            <div className="sk-panel">
              <div className="sk-panel-header">
                <div className="sk-panel-header-title">Activate Component</div>
                <a onClick={this.deny} className="sk-a info close-button">
                  Cancel
                </a>
              </div>
              <div className="sk-panel-content">
                <div className="sk-panel-section">
                  <div className="sk-panel-row">
                    <div className="sk-h2">
                      <strong>{this.props.component.displayName}</strong>
                      {' would like to interact with your '}
                      {this.props.permissionsString}
                    </div>
                  </div>
                  <div className="sk-panel-row">
                    <p className="sk-p">
                      Components use an offline messaging system to communicate. Learn more at{' '}
                      <a
                        href="https://standardnotes.com/permissions"
                        rel="noopener"
                        target="_blank"
                        className="sk-a info"
                      >
                        https://standardnotes.com/permissions.
                      </a>
                    </p>
                  </div>
                </div>
              </div>
              <div className="sk-panel-footer">
                <button onClick={this.accept} className="sn-button info block w-full text-base py-3">
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default PermissionsModal

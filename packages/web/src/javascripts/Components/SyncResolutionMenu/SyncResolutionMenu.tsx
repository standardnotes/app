import { WebApplication } from '@/Application/WebApplication'
import { AbstractComponent } from '@/Components/Abstract/PureComponent'

type Props = {
  application: WebApplication
  close: () => void
}

class SyncResolutionMenu extends AbstractComponent<Props> {
  constructor(props: Props) {
    super(props, props.application)
  }

  close = () => {
    this.props.close()
  }

  override render() {
    return (
      <div className="sn-component">
        <div
          id="sync-resolution-menu"
          className="absolute bottom-[40px] left-[inherit] right-0 z-footer-bar-item-panel mt-4 flex max-h-[85vh] min-w-[300px] flex-col border border-solid border-border bg-default shadow-main"
        >
          <div className="flex flex-shrink-0 items-center justify-between border-b border-solid border-border bg-contrast px-6 py-3 text-text">
            <div className="text-base font-medium">Out of Sync</div>
            <a onClick={this.close} className="text-sm font-bold text-info">
              Close
            </a>
          </div>
          <div className="h-full flex-grow overflow-scroll overflow-x-auto overflow-y-auto p-6 text-sm leading-tight">
            <div className="flex flex-col">
              <div className="mb-3.5">
                We've detected that the data in the current application session may not match the data on the server. An
                attempt was made to auto-resolve the issue, but it was unable to reconcile the differences.
              </div>
              <div className="sk-p sk-panel-row mb-3.5">
                <div className="sk-panel-column">
                  <div className="mb-2 font-bold">Option 1 — Restart Application:</div>
                  <div>Quit the application and re-open it. Sometimes, this may resolve the issue.</div>
                </div>
              </div>
              <div className="sk-p sk-panel-row">
                <div className="sk-panel-column">
                  <div className="mb-2 font-bold">Option 2 — Sign Out and Back In:</div>
                  <div>
                    Sign out of your account, then sign back in. This will ensure your data is consistent with the
                    server. Be sure to download a backup of your data before doing so.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default SyncResolutionMenu

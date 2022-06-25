import { WebApplication } from '@/Application/Application'
import { PureComponent } from '@/Components/Abstract/PureComponent'

type Props = {
  application: WebApplication
  close: () => void
}

class SyncResolutionMenu extends PureComponent<Props> {
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
          className="flex flex-col mt-4 min-w-[300px] max-h-[85vh] absolute right-0 left-[inherit] bottom-[40px] z-footer-bar-item-panel bg-default border border-solid border-border shadow-main"
        >
          <div className="flex-shrink-0 flex justify-between items-center px-6 py-3 border-b border-solid border-border bg-contrast text-text">
            <div className="font-medium text-base">Out of Sync</div>
            <a onClick={this.close} className="text-info font-bold text-sm">
              Close
            </a>
          </div>
          <div className="flex-grow h-full overflow-scroll overflow-y-auto overflow-x-auto p-6 text-sm leading-tight">
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

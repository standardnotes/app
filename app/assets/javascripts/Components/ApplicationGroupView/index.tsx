import { ApplicationGroup } from '@/UIModels/ApplicationGroup'
import { WebApplication } from '@/UIModels/Application'
import { Component } from 'preact'
import { ApplicationView } from '@/Components/ApplicationView'
import { WebOrDesktopDevice } from '@/Device/WebOrDesktopDevice'
import { ApplicationGroupEvent, Runtime, ApplicationGroupEventData, DeinitSource } from '@standardnotes/snjs'
import { unmountComponentAtNode, findDOMNode } from 'preact/compat'
import { DialogContent, DialogOverlay } from '@reach/dialog'
import { isDesktopApplication } from '@/Utils'

type Props = {
  server: string
  device: WebOrDesktopDevice
  enableUnfinished: boolean
  websocketUrl: string
  onDestroy: () => void
}

type State = {
  activeApplication?: WebApplication
  dealloced?: boolean
  deallocSource?: DeinitSource
  deviceDestroyed?: boolean
}

export class ApplicationGroupView extends Component<Props, State> {
  applicationObserverRemover?: () => void
  private group?: ApplicationGroup
  private application?: WebApplication

  constructor(props: Props) {
    super(props)

    if (props.device.isDeviceDestroyed()) {
      this.state = {
        deviceDestroyed: true,
      }

      return
    }

    this.group = new ApplicationGroup(
      props.server,
      props.device,
      props.enableUnfinished ? Runtime.Dev : Runtime.Prod,
      props.websocketUrl,
    )

    window.mainApplicationGroup = this.group

    this.applicationObserverRemover = this.group.addEventObserver((event, data) => {
      if (event === ApplicationGroupEvent.PrimaryApplicationSet) {
        const castData = data as ApplicationGroupEventData[ApplicationGroupEvent.PrimaryApplicationSet]

        this.application = castData.application as WebApplication
        this.setState({ activeApplication: this.application })
      } else if (event === ApplicationGroupEvent.DeviceWillRestart) {
        const castData = data as ApplicationGroupEventData[ApplicationGroupEvent.DeviceWillRestart]

        this.setState({ dealloced: true, deallocSource: castData.source })
      }
    })

    this.state = {}

    this.group.initialize().catch(console.error)
  }

  deinit() {
    this.application = undefined

    this.applicationObserverRemover?.()
    ;(this.applicationObserverRemover as unknown) = undefined

    this.group?.deinit()
    ;(this.group as unknown) = undefined

    this.setState({ dealloced: true, activeApplication: undefined })

    const onDestroy = this.props.onDestroy

    const node = findDOMNode(this) as Element
    unmountComponentAtNode(node)

    onDestroy()
  }

  render() {
    const renderDialog = (message: string) => {
      return (
        <DialogOverlay className={'sn-component challenge-modal-overlay'}>
          <DialogContent
            className={
              'challenge-modal flex flex-col items-center bg-default p-8 rounded relative shadow-overlay-light border-1 border-solid border-main'
            }
          >
            {message}
          </DialogContent>
        </DialogOverlay>
      )
    }

    if (this.state.deviceDestroyed) {
      const message = `Secure memory has destroyed this application instance. ${
        isDesktopApplication()
          ? 'Restart the app to continue.'
          : 'Close this browser tab and open a new one to continue.'
      }`

      return renderDialog(message)
    }

    if (this.state.dealloced) {
      const message = this.state.deallocSource === DeinitSource.Lock ? 'Locking workspace...' : 'Switching workspace...'
      return renderDialog(message)
    }

    if (!this.group || !this.state.activeApplication || this.state.activeApplication.dealloced) {
      return null
    }

    return (
      <div id={this.state.activeApplication.identifier} key={this.state.activeApplication.ephemeralIdentifier}>
        <ApplicationView
          key={this.state.activeApplication.ephemeralIdentifier}
          mainApplicationGroup={this.group}
          application={this.state.activeApplication}
        />
      </div>
    )
  }
}

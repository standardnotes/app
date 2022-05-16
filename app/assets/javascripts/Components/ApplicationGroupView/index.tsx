import { ApplicationGroup } from '@/UIModels/ApplicationGroup'
import { WebApplication } from '@/UIModels/Application'
import { Component } from 'preact'
import { ApplicationView } from '@/Components/ApplicationView'
import { WebOrDesktopDevice } from '@/Device/WebOrDesktopDevice'
import { ApplicationGroupEvent, Runtime } from '@standardnotes/snjs'
import { unmountComponentAtNode, findDOMNode } from 'preact/compat'

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
}

export class ApplicationGroupView extends Component<Props, State> {
  applicationObserverRemover: () => void
  private group: ApplicationGroup
  private application?: WebApplication

  constructor(props: Props) {
    super(props)

    this.group = new ApplicationGroup(
      props.server,
      props.device,
      props.enableUnfinished ? Runtime.Dev : Runtime.Prod,
      props.websocketUrl,
    )

    window.mainApplicationGroup = this.group

    this.applicationObserverRemover = this.group.addEventObserver((event, data) => {
      if (event === ApplicationGroupEvent.PrimaryDescriptorChanged) {
        this.deinit()
      } else if (event === ApplicationGroupEvent.PrimaryApplicationChanged) {
        this.application = data?.primaryApplication as WebApplication

        this.setState({ activeApplication: this.application })
      }
    })

    this.state = {}

    this.group.initialize().catch(console.error)
  }

  deinit() {
    this.application = undefined

    this.applicationObserverRemover()
    ;(this.applicationObserverRemover as unknown) = undefined

    this.group.deinit()
    ;(this.group as unknown) = undefined

    this.setState({ dealloced: true, activeApplication: undefined })

    const onDestroy = this.props.onDestroy

    const node = findDOMNode(this) as Element
    unmountComponentAtNode(node)

    onDestroy()
  }

  render() {
    if (this.state.dealloced || !this.state.activeApplication || this.state.activeApplication.dealloced) {
      return null
    }

    return (
      <div id={this.state.activeApplication.identifier} key={this.state.activeApplication.ephemeralIdentifier}>
        <ApplicationView
          key={this.state.activeApplication.ephemeralIdentifier}
          mainApplicationGroup={this.group}
          application={this.state.activeApplication}
          isApplicationView={true}
        />
      </div>
    )
  }
}

import { WebApplication } from '@/Application/Application'
import { SNComponent } from '@standardnotes/snjs'
import { Component } from 'react'
import Button from '@/Components/Button/Button'
import ModalDialog from '../Shared/ModalDialog'
import ModalDialogLabel from '../Shared/ModalDialogLabel'
import ModalDialogDescription from '../Shared/ModalDialogDescription'
import ModalDialogButtons from '../Shared/ModalDialogButtons'

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
      <ModalDialog className="w-[350px]">
        <ModalDialogLabel closeDialog={this.deny}>Activate Component</ModalDialogLabel>
        <ModalDialogDescription>
          <div className="text-base">
            <strong>{this.props.component.displayName}</strong>
            {' would like to interact with your '}
            {this.props.permissionsString}
          </div>
          <div className="sk-panel-row">
            <p className="sk-p">
              Components use an offline messaging system to communicate. Learn more at{' '}
              <a href="https://standardnotes.com/permissions" rel="noopener" target="_blank" className="sk-a info">
                https://standardnotes.com/permissions.
              </a>
            </p>
          </div>
        </ModalDialogDescription>
        <ModalDialogButtons>
          <Button primary fullWidth onClick={this.accept} className="block">
            Continue
          </Button>
        </ModalDialogButtons>
      </ModalDialog>
    )
  }
}

export default PermissionsModal

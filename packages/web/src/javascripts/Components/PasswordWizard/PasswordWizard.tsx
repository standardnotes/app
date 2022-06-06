import { WebApplication } from '@/Application/Application'
import { ChangeEventHandler, createRef } from 'react'
import { PureComponent } from '@/Components/Abstract/PureComponent'

interface Props {
  application: WebApplication
  dismissModal: () => void
}

type State = {
  continueTitle: string
  formData: FormData
  isContinuing?: boolean
  lockContinue?: boolean
  processing?: boolean
  showSpinner?: boolean
  step: Steps
  title: string
}

const DEFAULT_CONTINUE_TITLE = 'Continue'

enum Steps {
  PasswordStep = 1,
  FinishStep = 2,
}

type FormData = {
  currentPassword?: string
  newPassword?: string
  newPasswordConfirmation?: string
  status?: string
}

class PasswordWizard extends PureComponent<Props, State> {
  private currentPasswordInput = createRef<HTMLInputElement>()

  constructor(props: Props) {
    super(props, props.application)
    this.registerWindowUnloadStopper()
    this.state = {
      formData: {},
      continueTitle: DEFAULT_CONTINUE_TITLE,
      step: Steps.PasswordStep,
      title: 'Change Password',
    }
  }

  override componentDidMount(): void {
    super.componentDidMount()
    this.currentPasswordInput.current?.focus()
  }

  override componentWillUnmount(): void {
    super.componentWillUnmount()
    window.onbeforeunload = null
  }

  registerWindowUnloadStopper() {
    window.onbeforeunload = () => {
      return true
    }
  }

  resetContinueState() {
    this.setState({
      showSpinner: false,
      continueTitle: DEFAULT_CONTINUE_TITLE,
      isContinuing: false,
    })
  }

  nextStep = async () => {
    if (this.state.lockContinue || this.state.isContinuing) {
      return
    }

    if (this.state.step === Steps.FinishStep) {
      this.dismiss()
      return
    }

    this.setState({
      isContinuing: true,
      showSpinner: true,
      continueTitle: 'Generating Keys...',
    })

    const valid = await this.validateCurrentPassword()
    if (!valid) {
      this.resetContinueState()
      return
    }

    const success = await this.processPasswordChange()
    if (!success) {
      this.resetContinueState()
      return
    }

    this.setState({
      isContinuing: false,
      showSpinner: false,
      continueTitle: 'Finish',
      step: Steps.FinishStep,
    })
  }

  async validateCurrentPassword() {
    const currentPassword = this.state.formData.currentPassword
    const newPass = this.state.formData.newPassword
    if (!currentPassword || currentPassword.length === 0) {
      this.application.alertService.alert('Please enter your current password.').catch(console.error)
      return false
    }

    if (!newPass || newPass.length === 0) {
      this.application.alertService.alert('Please enter a new password.').catch(console.error)
      return false
    }
    if (newPass !== this.state.formData.newPasswordConfirmation) {
      this.application.alertService.alert('Your new password does not match its confirmation.').catch(console.error)
      this.setFormDataState({
        status: undefined,
      }).catch(console.error)
      return false
    }

    if (!this.application.getUser()?.email) {
      this.application.alertService
        .alert("We don't have your email stored. Please sign out then log back in to fix this issue.")
        .catch(console.error)
      this.setFormDataState({
        status: undefined,
      }).catch(console.error)
      return false
    }

    /** Validate current password */
    const success = await this.application.validateAccountPassword(this.state.formData.currentPassword as string)
    if (!success) {
      this.application.alertService
        .alert('The current password you entered is not correct. Please try again.')
        .catch(console.error)
    }
    return success
  }

  async processPasswordChange() {
    await this.application.downloadBackup()

    this.setState({
      lockContinue: true,
      processing: true,
    })

    await this.setFormDataState({
      status: 'Processing encryption keys…',
    })

    const newPassword = this.state.formData.newPassword
    const response = await this.application.changePassword(
      this.state.formData.currentPassword as string,
      newPassword as string,
    )

    const success = !response.error
    this.setState({
      processing: false,
      lockContinue: false,
    })

    if (!success) {
      this.setFormDataState({
        status: 'Unable to process your password. Please try again.',
      }).catch(console.error)
    } else {
      this.setState({
        formData: {
          ...this.state.formData,
          status: 'Successfully changed password.',
        },
      })
    }
    return success
  }

  dismiss = () => {
    if (this.state.lockContinue) {
      this.application.alertService.alert('Cannot close window until pending tasks are complete.').catch(console.error)
    } else {
      this.props.dismissModal()
    }
  }

  async setFormDataState(formData: Partial<FormData>) {
    return this.setState({
      formData: {
        ...this.state.formData,
        ...formData,
      },
    })
  }

  handleCurrentPasswordInputChange: ChangeEventHandler<HTMLInputElement> = ({ currentTarget }) => {
    this.setFormDataState({
      currentPassword: currentTarget.value,
    }).catch(console.error)
  }

  handleNewPasswordInputChange: ChangeEventHandler<HTMLInputElement> = ({ currentTarget }) => {
    this.setFormDataState({
      newPassword: currentTarget.value,
    }).catch(console.error)
  }

  handleNewPasswordConfirmationInputChange: ChangeEventHandler<HTMLInputElement> = ({ currentTarget }) => {
    this.setFormDataState({
      newPasswordConfirmation: currentTarget.value,
    }).catch(console.error)
  }

  override render() {
    return (
      <div className="sn-component">
        <div id="password-wizard" className="sk-modal small auto-height">
          <div className="sk-modal-background" />
          <div className="sk-modal-content">
            <div className="sn-component">
              <div className="sk-panel">
                <div className="sk-panel-header">
                  <div className="sk-panel-header-title">{this.state.title}</div>
                  <a onClick={this.dismiss} className="sk-a info close-button">
                    Close
                  </a>
                </div>
                <div className="sk-panel-content">
                  {this.state.step === Steps.PasswordStep && (
                    <div className="sk-panel-section">
                      <div className="sk-panel-row">
                        <div className="sk-panel-column stretch">
                          <form className="sk-panel-form">
                            <label htmlFor="password-wiz-current-password" className="block mb-1">
                              Current Password
                            </label>

                            <input
                              ref={this.currentPasswordInput}
                              id="password-wiz-current-password"
                              value={this.state.formData.currentPassword}
                              onChange={this.handleCurrentPasswordInputChange}
                              type="password"
                              className="sk-input contrast"
                            />

                            <div className="sk-panel-row" />

                            <label htmlFor="password-wiz-new-password" className="block mb-1">
                              New Password
                            </label>

                            <input
                              id="password-wiz-new-password"
                              value={this.state.formData.newPassword}
                              onChange={this.handleNewPasswordInputChange}
                              type="password"
                              className="sk-input contrast"
                            />
                            <div className="sk-panel-row" />

                            <label htmlFor="password-wiz-confirm-new-password" className="block mb-1">
                              Confirm New Password
                            </label>

                            <input
                              id="password-wiz-confirm-new-password"
                              value={this.state.formData.newPasswordConfirmation}
                              onChange={this.handleNewPasswordConfirmationInputChange}
                              type="password"
                              className="sk-input contrast"
                            />
                          </form>
                        </div>
                      </div>
                    </div>
                  )}
                  {this.state.step === Steps.FinishStep && (
                    <div className="sk-panel-section">
                      <div className="sk-label sk-bold info">Your password has been successfully changed.</div>
                      <p className="sk-p">
                        Please ensure you are running the latest version of Standard Notes on all platforms to ensure
                        maximum compatibility.
                      </p>
                    </div>
                  )}
                </div>
                <div className="sk-panel-footer">
                  <button
                    onClick={this.nextStep}
                    disabled={this.state.lockContinue}
                    className="sn-button min-w-20 info"
                  >
                    {this.state.continueTitle}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default PasswordWizard

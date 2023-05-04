import { WebApplication } from '@/Application/WebApplication'
import { createRef } from 'react'
import { AbstractComponent } from '@/Components/Abstract/PureComponent'
import DecoratedPasswordInput from '../Input/DecoratedPasswordInput'
import Modal from '../Modal/Modal'
import { isMobileScreen } from '@/Utils'
import Spinner from '../Spinner/Spinner'

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
const GENERATING_CONTINUE_TITLE = 'Generating Keys...'
const FINISH_CONTINUE_TITLE = 'Finish'

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

class PasswordWizard extends AbstractComponent<Props, State> {
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
      continueTitle: GENERATING_CONTINUE_TITLE,
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
      continueTitle: FINISH_CONTINUE_TITLE,
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
    await this.application.performDesktopTextBackup()

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

  handleCurrentPasswordInputChange = (currentPassword: string) => {
    this.setFormDataState({
      currentPassword,
    }).catch(console.error)
  }

  handleNewPasswordInputChange = (newPassword: string) => {
    this.setFormDataState({
      newPassword,
    }).catch(console.error)
  }

  handleNewPasswordConfirmationInputChange = (newPasswordConfirmation: string) => {
    this.setFormDataState({
      newPasswordConfirmation,
    }).catch(console.error)
  }

  override render() {
    return (
      <div className="sn-component h-full w-full md:h-auto md:w-auto" id="password-wizard">
        <Modal
          title={this.state.title}
          close={this.dismiss}
          actions={[
            {
              label: 'Cancel',
              onClick: this.dismiss,
              type: 'cancel',
              mobileSlot: 'left',
            },
            {
              label:
                this.state.continueTitle === GENERATING_CONTINUE_TITLE && isMobileScreen() ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  this.state.continueTitle
                ),
              onClick: this.nextStep,
              type: 'primary',
              mobileSlot: 'right',
              disabled: this.state.lockContinue,
            },
          ]}
        >
          <div className="px-4 py-4">
            {this.state.step === Steps.PasswordStep && (
              <div className="flex flex-col pb-1.5">
                <form>
                  <label htmlFor="password-wiz-current-password" className="mb-1 block">
                    Current Password
                  </label>

                  <DecoratedPasswordInput
                    ref={this.currentPasswordInput}
                    id="password-wiz-current-password"
                    value={this.state.formData.currentPassword}
                    onChange={this.handleCurrentPasswordInputChange}
                    type="password"
                  />

                  <div className="min-h-2" />

                  <label htmlFor="password-wiz-new-password" className="mb-1 block">
                    New Password
                  </label>

                  <DecoratedPasswordInput
                    id="password-wiz-new-password"
                    value={this.state.formData.newPassword}
                    onChange={this.handleNewPasswordInputChange}
                    type="password"
                  />

                  <div className="min-h-2" />

                  <label htmlFor="password-wiz-confirm-new-password" className="mb-1 block">
                    Confirm New Password
                  </label>

                  <DecoratedPasswordInput
                    id="password-wiz-confirm-new-password"
                    value={this.state.formData.newPasswordConfirmation}
                    onChange={this.handleNewPasswordConfirmationInputChange}
                    type="password"
                  />
                </form>
              </div>
            )}
            {this.state.step === Steps.FinishStep && (
              <div className="flex flex-col">
                <div className="mb-1 font-bold text-info">Your password has been successfully changed.</div>
                <p className="sk-p">
                  Please ensure you are running the latest version of Standard Notes on all platforms to ensure maximum
                  compatibility.
                </p>
              </div>
            )}
          </div>
        </Modal>
      </div>
    )
  }
}

export default PasswordWizard

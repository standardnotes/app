import { WebApplication } from '@/Application/WebApplication'
import { AbstractComponent } from '@/Components/Abstract/PureComponent'
import Modal from '../Modal/Modal'
import { isMobileScreen } from '@/Utils'
import Spinner from '../Spinner/Spinner'
import { PasswordStep } from './PasswordStep'
import { FinishStep } from './FinishStep'
import { PreprocessingStep } from './PreprocessingStep'
import { c } from 'ttag'

interface Props {
  application: WebApplication
  dismissModal: () => void
}

enum ContinueTitle {
  Default,
  Generating,
  Finish,
}

type State = {
  continueTitle: ContinueTitle
  formData: FormData
  isContinuing?: boolean
  lockContinue?: boolean
  processing?: boolean
  showSpinner?: boolean
  step: Steps
}

enum Steps {
  PreprocessingStep = 'preprocessing-step',
  PasswordStep = 'password-step',
  FinishStep = 'finish-step',
}

type FormData = {
  currentPassword?: string
  newPassword?: string
  newPasswordConfirmation?: string
  status?: string
}

class PasswordWizard extends AbstractComponent<Props, State> {
  constructor(props: Props) {
    super(props, props.application)
    this.registerWindowUnloadStopper()

    const baseState = {
      formData: {},
      continueTitle: ContinueTitle.Default,
    }

    if (props.application.featuresController.isVaultsEnabled()) {
      this.state = {
        ...baseState,
        lockContinue: true,
        step: Steps.PreprocessingStep,
      }
    } else {
      this.state = {
        ...baseState,
        lockContinue: false,
        step: Steps.PasswordStep,
      }
    }
  }

  override componentDidMount(): void {
    super.componentDidMount()
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
      continueTitle: ContinueTitle.Default,
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

    if (this.state.step === Steps.PreprocessingStep) {
      this.setState({
        step: Steps.PasswordStep,
      })

      return
    }

    this.setState({
      isContinuing: true,
      showSpinner: true,
      continueTitle: ContinueTitle.Generating,
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
      continueTitle: ContinueTitle.Finish,
      step: Steps.FinishStep,
    })
  }

  async validateCurrentPassword() {
    const currentPassword = this.state.formData.currentPassword
    const newPass = this.state.formData.newPassword
    if (!currentPassword || currentPassword.length === 0) {
      this.application.alerts.alert(c('Error').t`Please enter your current password.`).catch(console.error)
      return false
    }

    if (!newPass || newPass.length === 0) {
      this.application.alerts.alert(c('Error').t`Please enter a new password.`).catch(console.error)
      return false
    }
    if (newPass !== this.state.formData.newPasswordConfirmation) {
      this.application.alerts
        .alert(c('Error').t`Your new password does not match its confirmation.`)
        .catch(console.error)
      this.setFormDataState({
        status: undefined,
      }).catch(console.error)
      return false
    }

    if (!this.application.sessions.getUser()?.email) {
      this.application.alerts
        .alert(c('Error').t`We don't have your email stored. Please sign out then log back in to fix this issue.`)
        .catch(console.error)
      this.setFormDataState({
        status: undefined,
      }).catch(console.error)
      return false
    }

    const success = await this.application.validateAccountPassword(this.state.formData.currentPassword as string)
    if (!success) {
      this.application.alerts
        .alert(c('Error').t`The current password you entered is not correct. Please try again.`)
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
      status: c('Status').t`Processing encryption keys…`,
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
        status: c('Status').t`Unable to process your password. Please try again.`,
      }).catch(console.error)
    } else {
      this.setState({
        formData: {
          ...this.state.formData,
          status: c('Status').t`Successfully changed password.`,
        },
      })
    }
    return success
  }

  dismiss = () => {
    if (this.state.processing) {
      this.application.alerts
        .alert(c('Error').t`Cannot close window until pending tasks are complete.`)
        .catch(console.error)
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

  setContinueEnabled = (enabled: boolean) => {
    this.setState({
      lockContinue: !enabled,
    })
  }

  nextStepFromPreprocessing = () => {
    if (this.state.lockContinue) {
      this.setState(
        {
          lockContinue: false,
        },
        () => {
          void this.nextStep()
        },
      )
    } else {
      void this.nextStep()
    }
  }

  continueLabel(): string {
    switch (this.state.continueTitle) {
      case ContinueTitle.Generating:
        return c('Action').t`Generating Keys...`
      case ContinueTitle.Finish:
        return c('Action').t`Finish`
      case ContinueTitle.Default:
      default:
        return c('Action').t`Continue`
    }
  }

  override render() {
    return (
      <div className="sn-component h-full w-full md:h-auto md:w-auto" id="password-wizard">
        <Modal
          title={c('Title').t`Change Password`}
          close={this.dismiss}
          actions={[
            {
              label: c('Action').t`Cancel`,
              onClick: this.dismiss,
              type: 'cancel',
              mobileSlot: 'left',
            },
            {
              label:
                this.state.continueTitle === ContinueTitle.Generating && isMobileScreen() ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  this.continueLabel()
                ),
              onClick: this.nextStep,
              type: 'primary',
              mobileSlot: 'right',
              disabled: this.state.lockContinue,
            },
          ]}
        >
          <div className="px-4.5 py-4">
            {this.state.step === Steps.PreprocessingStep && (
              <PreprocessingStep
                onContinue={this.nextStepFromPreprocessing}
                setContinueEnabled={this.setContinueEnabled}
              />
            )}

            {this.state.step === Steps.PasswordStep && (
              <PasswordStep
                onCurrentPasswordChange={this.handleCurrentPasswordInputChange}
                onNewPasswordChange={this.handleNewPasswordInputChange}
                onNewPasswordConfirmationChange={this.handleNewPasswordConfirmationInputChange}
              />
            )}

            {this.state.step === Steps.FinishStep && <FinishStep />}
          </div>
        </Modal>
      </div>
    )
  }
}

export default PasswordWizard

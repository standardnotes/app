import { WebApplication } from '@/ui_models/application';
import { DialogContent, DialogOverlay } from '@reach/dialog';
import {
  ChallengeValue,
  removeFromArray,
  Challenge,
  ChallengeReason,
  ChallengePrompt,
  ChallengeValidation,
  ProtectionSessionDurations,
} from '@standardnotes/snjs';
import { confirmDialog } from '@/services/alertService';
import { STRING_SIGN_OUT_CONFIRMATION } from '@/strings';
import { createRef } from 'preact';
import { PureComponent } from '@/components/Abstract/PureComponent';
import { ProtectedIllustration } from '@standardnotes/stylekit';
import { DecoratedPasswordInput } from './DecoratedPasswordInput';
import { Button } from './Button';
import { DecoratedInput } from './DecoratedInput';

type InputValue = {
  prompt: ChallengePrompt;
  value: string | number | boolean;
  invalid: boolean;
};

type Values = Record<number, InputValue>;

type State = {
  prompts: ChallengePrompt[];
  values: Partial<Values>;
  processing: boolean;
  forgotPasscode: boolean;
  showForgotPasscodeLink: boolean;
  processingPrompts: ChallengePrompt[];
  hasAccount: boolean;
  protectedNoteAccessDuration: number;
};

type Props = {
  challenge: Challenge;
  application: WebApplication;
  onDismiss: (challenge: Challenge) => void;
};

export class ChallengeModal extends PureComponent<Props, State> {
  submitting = false;
  protectionsSessionDurations = ProtectionSessionDurations;
  protectionsSessionValidation = ChallengeValidation.ProtectionSessionDuration;
  private initialFocusRef = createRef<HTMLInputElement>();

  constructor(props: Props) {
    super(props, props.application);

    const values = {} as Values;
    const prompts = this.props.challenge.prompts;
    for (const prompt of prompts) {
      values[prompt.id] = {
        prompt,
        value: prompt.initialValue ?? '',
        invalid: false,
      };
    }
    const showForgotPasscodeLink = [
      ChallengeReason.ApplicationUnlock,
      ChallengeReason.Migration,
    ].includes(this.props.challenge.reason);
    this.state = {
      prompts,
      values,
      processing: false,
      forgotPasscode: false,
      showForgotPasscodeLink,
      hasAccount: this.application.hasAccount(),
      processingPrompts: [],
      protectedNoteAccessDuration: ProtectionSessionDurations[0].valueInSeconds,
    };
  }

  componentDidMount(): void {
    super.componentDidMount();

    this.application.addChallengeObserver(this.props.challenge, {
      onValidValue: (value) => {
        this.state.values[value.prompt.id]!.invalid = false;
        removeFromArray(this.state.processingPrompts, value.prompt);
        this.reloadProcessingStatus();
        this.afterStateChange();
      },
      onInvalidValue: (value) => {
        this.state.values[value.prompt.id]!.invalid = true;
        /** If custom validation, treat all values together and not individually */
        if (!value.prompt.validates) {
          this.setState({ processingPrompts: [], processing: false });
        } else {
          removeFromArray(this.state.processingPrompts, value.prompt);
          this.reloadProcessingStatus();
        }
        this.afterStateChange();
      },
      onComplete: () => {
        this.dismiss();
      },
      onCancel: () => {
        this.dismiss();
      },
    });
  }

  deinit() {
    (this.application as unknown) = undefined;
    (this.props.challenge as unknown) = undefined;
    super.deinit();
  }

  reloadProcessingStatus() {
    return this.setState({
      processing: this.state.processingPrompts.length > 0,
    });
  }

  destroyLocalData = async () => {
    if (
      await confirmDialog({
        text: STRING_SIGN_OUT_CONFIRMATION,
        confirmButtonStyle: 'danger',
      })
    ) {
      this.dismiss();
      this.application.user.signOut();
    }
  };

  cancel = () => {
    if (this.props.challenge.cancelable) {
      this.application.cancelChallenge(this.props.challenge);
    }
  };

  onForgotPasscodeClick = () => {
    this.setState({
      forgotPasscode: true,
    });
  };

  onTextValueChange = (prompt: ChallengePrompt) => {
    const values = this.state.values;
    values[prompt.id]!.invalid = false;
    this.setState({ values });
  };

  onNumberValueChange(prompt: ChallengePrompt, value: number) {
    const values = this.state.values;
    values[prompt.id]!.invalid = false;
    values[prompt.id]!.value = value;
    this.setState({ values });
  }

  validate() {
    let failed = 0;
    for (const prompt of this.state.prompts) {
      const value = this.state.values[prompt.id]!;
      if (typeof value.value === 'string' && value.value.length === 0) {
        this.state.values[prompt.id]!.invalid = true;
        failed++;
      }
    }
    return failed === 0;
  }

  submit = async () => {
    if (!this.validate()) {
      return;
    }
    if (this.submitting || this.state.processing) {
      return;
    }
    this.submitting = true;
    await this.setState({ processing: true });
    const values: ChallengeValue[] = [];
    for (const inputValue of Object.values(this.state.values)) {
      const rawValue = inputValue!.value;
      const value = new ChallengeValue(inputValue!.prompt, rawValue);
      values.push(value);
    }
    const processingPrompts = values.map((v) => v.prompt);
    await this.setState({
      processingPrompts: processingPrompts,
      processing: processingPrompts.length > 0,
    });
    /**
     * Unfortunately neccessary to wait 50ms so that the above setState call completely
     * updates the UI to change processing state, before we enter into UI blocking operation
     * (crypto key generation)
     */
    setTimeout(() => {
      if (values.length > 0) {
        this.application.submitValuesForChallenge(this.props.challenge, values);
      } else {
        this.setState({ processing: false });
      }
      this.submitting = false;
    }, 50);
  };

  afterStateChange() {
    this.render();
  }

  dismiss = () => {
    this.props.onDismiss(this.props.challenge);
  };

  private renderChallengePrompts() {
    return this.state.prompts.map((prompt, index) => (
      <>
        {/** ProtectionSessionDuration can't just be an input field */}
        {prompt.validation === ChallengeValidation.ProtectionSessionDuration ? (
          <div key={prompt.id} className="sk-panel-row">
            <div className="sk-horizontal-group mt-3">
              <div className="sk-p sk-bold">Allow protected access for</div>
              {ProtectionSessionDurations.map((option) => (
                <a
                  className={
                    'sk-a info ' +
                    (option.valueInSeconds ===
                    this.state.values[prompt.id]!.value
                      ? 'boxed'
                      : '')
                  }
                  onClick={(event) => {
                    event.preventDefault();
                    this.onNumberValueChange(prompt, option.valueInSeconds);
                  }}
                >
                  {option.label}
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div key={prompt.id} className="sk-panel-row">
            <form
              className="w-full"
              onSubmit={(event) => {
                event.preventDefault();
                this.submit();
              }}
            >
              {prompt.secureTextEntry ? (
                <DecoratedPasswordInput
                  ref={index === 0 ? this.initialFocusRef : undefined}
                  className="min-w-68 mb-3.5"
                  placeholder={prompt.title}
                  value={this.state.values[prompt.id]?.value as string}
                  onChange={(value: string) => {
                    this.state.values[prompt.id]!.value = value;
                    this.onTextValueChange(prompt);
                  }}
                />
              ) : (
                <DecoratedInput
                  ref={index === 0 ? this.initialFocusRef : undefined}
                  className="min-w-68 mb-3.5"
                  placeholder={prompt.title}
                  value={this.state.values[prompt.id]?.value as string}
                  onChange={(value: string) => {
                    this.state.values[prompt.id]!.value = value;
                    this.onTextValueChange(prompt);
                  }}
                />
              )}
            </form>
          </div>
        )}

        {this.state.values[prompt.id]!.invalid && (
          <div className="sk-panel-row centered">
            <label className="sk-label danger">
              Invalid authentication. Please try again.
            </label>
          </div>
        )}
      </>
    ));
  }

  render() {
    if (!this.state.prompts) {
      return <></>;
    }
    return (
      <DialogOverlay
        className="challenge-modal-overlay"
        initialFocusRef={this.initialFocusRef}
        onDismiss={() => {
          if (this.props.challenge.cancelable) {
            this.cancel();
          }
        }}
      >
        <DialogContent className="challenge-modal sk-modal-content sn-component focus:shadow-none">
          <div className="flex flex-col items-center bg-default p-4">
            <ProtectedIllustration className="w-30 h-30 mb-4" />
            <div className="font-bold text-base mb-4">
              {this.props.challenge.heading}
            </div>
            {this.renderChallengePrompts()}
            <Button
              type="primary"
              disabled={this.state.processing}
              className="min-w-68 mb-3.5"
              onClick={() => {
                this.submit();
              }}
            >
              {this.state.processing ? 'Generating Keys...' : 'Unlock'}
            </Button>
            <Button
              type="normal"
              className="min-w-68"
              onClick={() => {
                //
              }}
            >
              Other options
            </Button>
          </div>
        </DialogContent>
      </DialogOverlay>
    );
  }
}

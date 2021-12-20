import { WebApplication } from '@/ui_models/application';
import { Dialog } from '@reach/dialog';
import {
  ChallengeValue,
  removeFromArray,
  Challenge,
  ChallengeReason,
  ChallengePrompt,
  ChallengeValidation,
  ProtectionSessionDurations,
} from '@standardnotes/snjs';
import { PureViewCtrl } from '@Views/abstract/pure_view_ctrl';
import { WebDirective } from '@/types';
import { confirmDialog } from '@/services/alertService';
import { STRING_SIGN_OUT_CONFIRMATION } from '@/strings';
import { Ref, render } from 'preact';
import { useRef } from 'preact/hooks';
import ng from 'angular';

type InputValue = {
  prompt: ChallengePrompt;
  value: string | number | boolean;
  invalid: boolean;
};

type Values = Record<number, InputValue>;

type ChallengeModalState = {
  prompts: ChallengePrompt[];
  values: Partial<Values>;
  processing: boolean;
  forgotPasscode: boolean;
  showForgotPasscodeLink: boolean;
  processingPrompts: ChallengePrompt[];
  hasAccount: boolean;
  protectedNoteAccessDuration: number;
};

class ChallengeModalCtrl extends PureViewCtrl<unknown, ChallengeModalState> {
  application!: WebApplication;
  challenge!: Challenge;
  onDismiss!: () => void;
  submitting = false;

  /** @template */
  protectionsSessionDurations = ProtectionSessionDurations;
  protectionsSessionValidation = ChallengeValidation.ProtectionSessionDuration;

  /* @ngInject */
  constructor(
    private $element: ng.IRootElementService,
    $timeout: ng.ITimeoutService
  ) {
    super($timeout);
  }

  getState() {
    return this.state as ChallengeModalState;
  }

  $onInit() {
    super.$onInit();
    const values = {} as Values;
    const prompts = this.challenge.prompts;
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
    ].includes(this.challenge.reason);
    this.setState({
      prompts,
      values,
      processing: false,
      forgotPasscode: false,
      showForgotPasscodeLink,
      hasAccount: this.application.hasAccount(),
      processingPrompts: [],
      protectedNoteAccessDuration: ProtectionSessionDurations[0].valueInSeconds,
    });
    this.application.addChallengeObserver(this.challenge, {
      onValidValue: (value) => {
        this.state.values[value.prompt.id]!.invalid = false;
        removeFromArray(this.state.processingPrompts, value.prompt);
        this.reloadProcessingStatus();
        /** Trigger UI update */
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
        /** Trigger UI update */
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
    (this.application as any) = undefined;
    (this.challenge as any) = undefined;
    super.deinit();
  }

  reloadProcessingStatus() {
    return this.setState({
      processing: this.state.processingPrompts.length > 0,
    });
  }

  async destroyLocalData() {
    if (
      await confirmDialog({
        text: STRING_SIGN_OUT_CONFIRMATION,
        confirmButtonStyle: 'danger',
      })
    ) {
      await this.application.signOut();
      this.dismiss();
    }
  }

  /** @template */
  cancel() {
    if (this.challenge.cancelable) {
      this.application!.cancelChallenge(this.challenge);
    }
  }

  onForgotPasscodeClick() {
    this.setState({
      forgotPasscode: true,
    });
  }

  onTextValueChange(prompt: ChallengePrompt) {
    const values = this.getState().values;
    values[prompt.id]!.invalid = false;
    this.setState({ values });
  }

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

  async submit() {
    if (!this.validate()) {
      return;
    }
    if (this.submitting || this.state.processing) {
      return;
    }
    this.submitting = true;
    await this.setState({ processing: true });
    const values: ChallengeValue[] = [];
    for (const inputValue of Object.values(this.getState().values)) {
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
    this.$timeout(() => {
      if (values.length > 0) {
        this.application.submitValuesForChallenge(this.challenge, values);
      } else {
        this.setState({ processing: false });
      }
      this.submitting = false;
    }, 50);
  }

  afterStateChange() {
    this.render();
  }

  dismiss() {
    this.onDismiss();
  }

  $onDestroy() {
    render(<></>, this.$element[0]);
  }

  private render() {
    if (!this.state.prompts) return;
    render(<ChallengeModalView ctrl={this} />, this.$element[0]);
  }
}

export class ChallengeModal extends WebDirective {
  constructor() {
    super();
    this.restrict = 'E';
    // this.template = template;
    this.controller = ChallengeModalCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {
      challenge: '=',
      application: '=',
      onDismiss: '&',
    };
  }
}

function ChallengeModalView({ ctrl }: { ctrl: ChallengeModalCtrl }) {
  const initialFocusRef = useRef<HTMLInputElement>(null);
  return (
    <Dialog
      initialFocusRef={initialFocusRef}
      onDismiss={() => {
        if (ctrl.challenge.cancelable) {
          ctrl.cancel();
        }
      }}
    >
      <div className="challenge-modal sk-modal-content">
        <div className="sn-component">
          <div className="sk-panel">
            <div className="sk-panel-header">
              <div className="sk-panel-header-title">
                {ctrl.challenge.modalTitle}
              </div>
            </div>
            <div className="sk-panel-content">
              <div className="sk-panel-section">
                <div className="sk-p sk-panel-row centered prompt">
                  <strong>{ctrl.challenge.heading}</strong>
                </div>
                {ctrl.challenge.subheading && (
                  <div className="sk-p sk-panel-row centered subprompt">
                    {ctrl.challenge.subheading}
                  </div>
                )}
              </div>

              <div className="sk-panel-section">
                {ChallengePrompts({ ctrl, initialFocusRef })}
              </div>
            </div>
            <div className="sk-panel-footer extra-padding">
              <button
                className={
                  'sn-button w-full ' +
                  (ctrl.state.processing ? 'neutral' : 'info')
                }
                disabled={ctrl.state.processing}
                onClick={() => ctrl.submit()}
              >
                {ctrl.state.processing ? 'Generating Keys…' : 'Submit'}
              </button>
              {ctrl.challenge.cancelable && (
                <>
                  <div className="sk-panel-row"></div>
                  <a
                    className="sk-panel-row sk-a info centered text-sm"
                    onClick={() => ctrl.cancel()}
                  >
                    Cancel
                  </a>
                </>
              )}
            </div>
            {ctrl.state.showForgotPasscodeLink && (
              <div className="sk-panel-footer">
                {ctrl.state.forgotPasscode ? (
                  <>
                    <p className="sk-panel-row sk-p">
                      {ctrl.state.hasAccount
                        ? 'If you forgot your application passcode, your ' +
                          'only option is to clear your local data from this ' +
                          'device and sign back in to your account.'
                        : 'If you forgot your application passcode, your ' +
                          'only option is to delete your data.'}
                    </p>
                    <a
                      className="sk-panel-row sk-a danger centered"
                      onClick={() => {
                        ctrl.destroyLocalData();
                      }}
                    >
                      Delete Local Data
                    </a>
                  </>
                ) : (
                  <a
                    className="sk-panel-row sk-a info centered"
                    onClick={() => ctrl.onForgotPasscodeClick()}
                  >
                    Forgot your passcode?
                  </a>
                )}
                <div className="sk-panel-row"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}

function ChallengePrompts({
  ctrl,
  initialFocusRef,
}: {
  ctrl: ChallengeModalCtrl;
  initialFocusRef: Ref<HTMLInputElement>;
}) {
  return ctrl.state.prompts.map((prompt, index) => (
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
                  (option.valueInSeconds === ctrl.state.values[prompt.id]!.value
                    ? 'boxed'
                    : '')
                }
                onClick={(event) => {
                  event.preventDefault();
                  ctrl.onNumberValueChange(prompt, option.valueInSeconds);
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
              ctrl.submit();
            }}
          >
            <input
              className="sk-input contrast"
              value={ctrl.state.values[prompt.id]!.value as string | number}
              onChange={(event) => {
                const value = (event.target as HTMLInputElement).value;
                ctrl.state.values[prompt.id]!.value = value;
                ctrl.onTextValueChange(prompt);
              }}
              ref={index === 0 ? initialFocusRef : undefined}
              placeholder={prompt.title}
              type={prompt.secureTextEntry ? 'password' : 'text'}
            />
          </form>
        </div>
      )}

      {ctrl.state.values[prompt.id]!.invalid && (
        <div className="sk-panel-row centered">
          <label className="sk-label danger">
            Invalid authentication. Please try again.
          </label>
        </div>
      )}
    </>
  ));
}

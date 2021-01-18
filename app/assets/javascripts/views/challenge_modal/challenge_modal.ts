import { WebApplication } from '@/ui_models/application';
import template from './challenge-modal.pug';
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

  /** @template */
  protectionsSessionDurations = ProtectionSessionDurations;
  protectionsSessionValidation =
    ChallengeValidation.ProtectionSessionDuration;

  /* @ngInject */
  constructor(private $element: JQLite, $timeout: ng.ITimeoutService) {
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
        this.getState().values[value.prompt.id]!.invalid = false;
        removeFromArray(this.state.processingPrompts, value.prompt);
        this.reloadProcessingStatus();
      },
      onInvalidValue: (value) => {
        this.getState().values[value.prompt.id]!.invalid = true;
        /** If custom validation, treat all values together and not individually */
        if (!value.prompt.validates) {
          this.setState({ processingPrompts: [], processing: false });
        } else {
          removeFromArray(this.state.processingPrompts, value.prompt);
          this.reloadProcessingStatus();
        }
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

  onValueChange(prompt: ChallengePrompt, value: number) {
    const values = this.state.values;
    values[prompt.id]!.invalid = false;
    values[prompt.id]!.value = value;
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
    }, 50);
  }

  dismiss() {
    const elem = this.$element;
    const scope = elem.scope();
    scope.$destroy();
    elem.remove();
  }
}

export class ChallengeModal extends WebDirective {
  constructor() {
    super();
    this.restrict = 'E';
    this.template = template;
    this.controller = ChallengeModalCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {
      challenge: '=',
      application: '=',
    };
  }
}

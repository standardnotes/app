import { WebDirective } from './../../types';
import { WebApplication } from './../../application';
import template from '%/directives/challenge-modal.pug';
import {
  ChallengeType,
  ChallengeValue,
  removeFromArray,
  Challenge,
  ChallengeOrchestrator
} from 'snjs';
import { PureCtrl } from '@Controllers/abstract/pure_ctrl';

type InputValue = {
  value: string
  invalid: boolean
}
type ChallengeModalScope = {
  application: WebApplication
  challenge: Challenge
  orchestrator: ChallengeOrchestrator
}

type Values = Record<ChallengeType, InputValue>

type ChallengeModalState = {
  types: ChallengeType[]
  values: Partial<Values>
  processing: boolean
}

class ChallengeModalCtrl extends PureCtrl implements ChallengeModalScope {
  private $element: JQLite
  private processingTypes: ChallengeType[] = []
  application!: WebApplication
  challenge!: Challenge
  orchestrator!: ChallengeOrchestrator

  /* @ngInject */
  constructor(
    $element: JQLite,
    $timeout: ng.ITimeoutService
  ) {
    super($timeout);
    this.$element = $element;
  }

  getState() {
    return this.state as ChallengeModalState;
  }

  $onInit() {
    super.$onInit();
    const values = {} as Values;
    const types = this.challenge.types;
    for (const type of types) {
      values[type] = {
        value: '',
        invalid: false
      };
    }
    this.setState({
      types: types,
      values: values,
      processing: false
    });
    this.orchestrator.setCallbacks(
      (value) => {
        this.getState().values[value.type]!.invalid = false;
        removeFromArray(this.processingTypes, value.type);
        this.reloadProcessingStatus();
      },
      (value) => {
        this.getState().values[value.type]!.invalid = true;
        removeFromArray(this.processingTypes, value.type);
        this.reloadProcessingStatus();
      },
      () => {
        this.dismiss();
      },
    );
  }

  deinit() {
    (this.application as any) = undefined;
    (this.orchestrator as any) = undefined;
    (this.challenge as any) = undefined;
    super.deinit();
  }

  reloadProcessingStatus() {
    this.setState({
      processing: this.processingTypes.length > 0
    });
  }

  promptForChallenge(challenge: ChallengeType) {
    if (challenge === ChallengeType.LocalPasscode) {
      return 'Enter your application passcode';
    } else {
      return 'Enter your account password';
    }
  }

  cancel() {
    // if (!this.cancelable) {
    //   return;
    // }
    this.dismiss();
  }

  onTextValueChange(challenge: ChallengeType) {
    const values = this.getState().values;
    values[challenge]!.invalid = false;
    this.setState({ values });
  }

  validate() {
    const failed = [];
    for (const type of this.getState().types) {
      const value = this.getState().values[type];
      if (!value || value.value.length === 0) {
        this.getState().values[type]!.invalid = true;
      }
    }
    return failed.length === 0;
  }

  async submit() {
    if (!this.validate()) {
      return;
    }
    this.setState({ processing: true });
    const values = [];
    for (const key of Object.keys(this.getState().values)) {
      const type = Number(key) as ChallengeType;
      if (!this.getState().values[type]!.invalid) {
        continue;
      }
      const rawValue = this.getState().values[type]!.value;
      const value = new ChallengeValue(type, rawValue);
      values.push(value);
    }
    this.processingTypes = values.map((v) => v.type);
    this.orchestrator.submitValues(values);
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
    this.bindToController = {
      challenge: '=',
      orchestrator: '=',
      application: '='
    };
  }
}

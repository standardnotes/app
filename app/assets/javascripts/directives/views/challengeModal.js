import template from '%/directives/challenge-modal.pug';
import { ChallengeType, ChallengeValue, removeFromArray } from 'snjs';
import { PureCtrl } from '@Controllers';

class ChallengeModalCtrl extends PureCtrl {
  /* @ngInject */
  constructor(
    $scope,
    $element,
    $timeout,
    application,
    appState
  ) {
    super($scope, $timeout, application, appState);
    this.$element = $element;
    this.processingTypes = [];
  }

  $onInit() {
    super.$onInit();
    const values = {};
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
    this.orchestrator.setCallbacks({
      onComplete: () => {
        this.dismiss();
      },
      onValidValue: (value) => {
        this.state.values[value.type].invalid = false;
        removeFromArray(this.processingTypes, value.type);
        this.reloadProcessingStatus();
      },
      onInvalidValue: (value) => {
        this.state.values[value.type].invalid = true;
        removeFromArray(this.processingTypes, value.type);
        this.reloadProcessingStatus();
      }
    });
  }

  reloadProcessingStatus() {
    this.setState({
      processing: this.processingTypes.length > 0
    });
  }

  promptForChallenge(challenge) {
    if (challenge === ChallengeType.LocalPasscode) {
      return 'Enter your application passcode';
    } else {
      return 'Enter your account password';
    }
  }

  cancel() {
    if (!this.cancelable) {
      return;
    }
    this.dismiss();
  }

  onTextValueChange(challenge) {
    const values = this.state.values;
    values[challenge].invalid = false;
    this.setState({ values });
  }

  validate() {
    const failed = [];
    for (const type of this.state.types) {
      const value = this.state.values[type];
      if (!value || value.length === 0) {
        this.state.values[type].invalid = true;
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
    for (const key of Object.keys(this.state.values)) {
      const type = Number(key);
      if(this.state.values[key].valid) {
        continue;
      }
      const rawValue = this.state.values[key].value;
      const value = new ChallengeValue(type, rawValue);
      values.push(value);
    }
    this.processingTypes = values.map((v) => v.type);
    this.orchestrator.submitValues(values);
  }

  dismiss() {
    this.$element.remove();
  }
}

export class ChallengeModal {
  constructor() {
    this.restrict = 'E';
    this.template = template;
    this.controller = ChallengeModalCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {
      onSubmit: '=',
      challenge: '=',
      orchestrator: '='
    };
  }
}

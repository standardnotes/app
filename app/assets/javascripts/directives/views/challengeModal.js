import template from '%/directives/challenge-modal.pug';
import { Challenges, ChallengeResponse } from 'snjs';
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
  }

  $onInit() {
    super.$onInit();
    this.values = {};
    this.setState({
      challenges: this.challenges
    });
  }

  promptForChallenge(challenge) {
    if(challenge === Challenges.LocalPasscode) {
      return 'Enter your application passcode';
    } else {
      return 'Enter your account password';
    }
  }

  cancel() {
    this.dismiss();
    this.onCancel && this.onCancel();
  }

  isChallengeInFailureState(challenge) {
    if (!this.failedChallenges) {
      return false;
    }
    return this.failedChallenges.find((candidate) => {
      return candidate === challenge;
    }) != null;
  }

  validate() {
    const failed = [];
    for (const cred of this.state.challenges) {
      const value = this.values[cred];
      if (!value || value.length === 0) {
        failed.push(cred);
      }
    }
    this.failedChallenges = failed;
    return failed.length === 0;
  }

  async submit() {
    if (!this.validate()) {
      return;
    }
    const responses = Object.keys(this.values).map((key) => {
      const challenge = Number(key);
      const value = this.values[key];
      return new ChallengeResponse(challenge, value);
    });
    this.onSubmit(responses);
    this.dismiss();
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
      onCancel: '=',
      challenges: '='
    };
  }
}

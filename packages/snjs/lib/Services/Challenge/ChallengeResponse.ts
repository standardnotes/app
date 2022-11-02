import { isNullOrUndefined } from '@standardnotes/utils'
import {
  Challenge,
  ChallengeResponseInterface,
  ChallengeValidation,
  ChallengeValue,
  ChallengeArtifacts,
} from '@standardnotes/services'

export class ChallengeResponse implements ChallengeResponseInterface {
  constructor(
    public readonly challenge: Challenge,
    public readonly values: ChallengeValue[],
    public readonly artifacts?: ChallengeArtifacts,
  ) {
    Object.freeze(this)
  }

  getValueForType(type: ChallengeValidation): ChallengeValue {
    const value = this.values.find((value) => value.prompt.validation === type)
    if (isNullOrUndefined(value)) {
      throw Error('Could not find value for validation type ' + type)
    }
    return value
  }

  getDefaultValue(): ChallengeValue {
    if (this.values.length > 1) {
      throw Error('Attempting to retrieve default response value when more than one value exists')
    }
    return this.values[0]
  }
}

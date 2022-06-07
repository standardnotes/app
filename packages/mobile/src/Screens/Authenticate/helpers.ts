import { ChallengePrompt, ChallengeValidation, ChallengeValue } from '@standardnotes/snjs'

export const isInActiveState = (state: AuthenticationValueStateType) =>
  state !== AuthenticationValueStateType.WaitingInput && state !== AuthenticationValueStateType.Success

export enum AuthenticationValueStateType {
  WaitingTurn = 0,
  WaitingInput = 1,
  Success = 2,
  Fail = 3,
  Pending = 4,
  Locked = 5,
}

type ChallengeValueState = {
  challengeValues: Record<string, ChallengeValue>
  challengeValueStates: Record<string, AuthenticationValueStateType>
}
type SetChallengeValueState = {
  type: 'setState'
  id: string
  state: AuthenticationValueStateType
}
type SetChallengeValue = {
  type: 'setValue'
  id: string
  value: ChallengeValue['value']
}

type Action = SetChallengeValueState | SetChallengeValue
export const authenticationReducer = (state: ChallengeValueState, action: Action): ChallengeValueState => {
  switch (action.type) {
    case 'setState': {
      return {
        ...state,
        challengeValueStates: {
          ...state.challengeValueStates,
          [action.id]: action.state,
        },
      }
    }
    case 'setValue': {
      const updatedChallengeValue = state.challengeValues[action.id]
      return {
        ...state,
        challengeValues: {
          ...state.challengeValues,
          [action.id]: {
            ...updatedChallengeValue,
            value: action.value,
          },
        },
      }
    }
    default:
      return state
  }
}

export const findIndexInObject = (
  map: ChallengeValueState['challengeValues'] | ChallengeValueState['challengeValueStates'],
  id: string,
) => {
  return Object.keys(map).indexOf(id)
}

export const getChallengePromptTitle = (prompt: ChallengePrompt, state: AuthenticationValueStateType) => {
  const title = prompt.title
  switch (state) {
    case AuthenticationValueStateType.WaitingTurn:
      return title ?? 'Waiting'
    case AuthenticationValueStateType.Locked:
      return title ?? 'Locked'
    default:
      return title
  }
}

export const getLabelForStateAndType = (validation: ChallengeValidation, state: AuthenticationValueStateType) => {
  switch (validation) {
    case ChallengeValidation.Biometric: {
      switch (state) {
        case AuthenticationValueStateType.WaitingTurn:
          return 'Waiting for passcode'
        case AuthenticationValueStateType.WaitingInput:
          return 'Press here to begin biometrics scan'
        case AuthenticationValueStateType.Pending:
          return 'Waiting for unlock'
        case AuthenticationValueStateType.Success:
          return 'Success | Biometrics'
        case AuthenticationValueStateType.Fail:
          return 'Biometrics failed. Tap to try again.'
        case AuthenticationValueStateType.Locked:
          return 'Biometrics locked. Try again in 30 seconds.'
        default:
          return ''
      }
    }
    default:
      switch (state) {
        case AuthenticationValueStateType.WaitingTurn:
        case AuthenticationValueStateType.WaitingInput:
          return 'Waiting'
        case AuthenticationValueStateType.Pending:
          return 'Verifying keys...'
        case AuthenticationValueStateType.Success:
          return 'Success'
        case AuthenticationValueStateType.Fail:
          return 'Invalid value. Please try again.'
        default:
          return ''
      }
  }
}

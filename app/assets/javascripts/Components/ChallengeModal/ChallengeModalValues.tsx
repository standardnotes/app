import { ChallengePrompt } from '@standardnotes/snjs'
import { InputValue } from './InputValue'

export type ChallengeModalValues = Record<ChallengePrompt['id'], InputValue>

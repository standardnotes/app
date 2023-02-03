import { ChallengePrompt } from '@standardnotes/snjs'

export type InputValue = {
  prompt: ChallengePrompt
  value: string | number | boolean | Record<string, unknown>
  invalid: boolean
}

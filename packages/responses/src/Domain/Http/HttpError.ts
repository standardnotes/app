import { ErrorTag } from './ErrorTag'

export type HttpError = {
  message: string
  tag?: ErrorTag
  payload?: Record<string, unknown>
}

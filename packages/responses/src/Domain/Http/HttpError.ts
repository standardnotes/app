import { ErrorTag } from './ErrorTag'

export type HttpError = {
  message: string
  tag?: ErrorTag
}

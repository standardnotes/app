import { ErrorTag } from './ErrorTag'

export type HttpErrorResponseBody = {
  error: {
    message: string
    tag?: ErrorTag
  }
}

import { HttpErrorResponse, getErrorFromErrorResponse } from '../Http'

export class ClientDisplayableError {
  constructor(
    public text: string,
    public title?: string,
    public tag?: string,
  ) {
    console.error('Client Displayable Error:', text, title || '', tag || '')
  }

  static FromError(error: { message: string; tag?: string }) {
    return new ClientDisplayableError(error.message, undefined, error.tag)
  }

  static FromString(text: string) {
    return new ClientDisplayableError(text)
  }

  static FromNetworkError(error: HttpErrorResponse) {
    return new ClientDisplayableError(getErrorFromErrorResponse(error).message)
  }
}

export function isClientDisplayableError(error: unknown): error is ClientDisplayableError {
  return error instanceof ClientDisplayableError
}

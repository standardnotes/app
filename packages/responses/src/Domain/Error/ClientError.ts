import { Error } from '../Http/Error'

export class ClientDisplayableError {
  constructor(public text: string, public title?: string, public tag?: string) {
    console.error('Client Displayable Error:', text, title || '', tag || '')
  }

  static FromError(error: Error) {
    return new ClientDisplayableError(error.message, undefined, error.tag)
  }
}

export class ClientDisplayableError {
  constructor(public text: string, public title?: string, public tag?: string) {
    console.error('Client Displayable Error:', text, title || '', tag || '')
  }

  static FromError(error: { message: string; tag?: string }) {
    return new ClientDisplayableError(error.message, undefined, error.tag)
  }
}

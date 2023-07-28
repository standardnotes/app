export class StandardException {
  constructor(
    public readonly message: string,
    log = false,
  ) {
    if (log) {
      console.error('StandardException raised: ', message)
    }
  }
}

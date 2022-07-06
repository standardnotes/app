export class ApiCallError extends Error {
  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, ApiCallError.prototype)
  }
}
